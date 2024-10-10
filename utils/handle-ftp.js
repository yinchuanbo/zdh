const { execSync } = require("child_process");
const Client = require("ssh2-sftp-client");
const fs = require("fs");
const crypto = require("crypto");
const { Readable } = require("stream");

let errorOccurred1,
  errorOccurred2,
  testConn = null,
  LocalList = null,
  devList = null;

function getAllFiles({ env, data, configs }) {
  let onlyLan = Object.keys(data);

  const folderList = configs.localPaths;
  let allData = {};

  const getAllCommitName = (commitList = [], lanPath = "") => {
    let fileNames = {},
      fileNameArr = [];
    commitList.forEach((commit) => {
      try {
        // const stdout = execSync(
        //   `git -C ${lanPath} log -1 ${commit} --name-only --pretty=format:`
        // );
        const stdout = execSync(
          `git -C ${lanPath} log --first-parent -1 ${commit} --name-only --pretty=format:`
        );
        fileNames = stdout
          .toString()
          .split("\n")
          .map((fileName) => {
            if (fileName.includes("/Dev/")) {
              return null;
            }
            if (env === "test") {
              if (fileName.includes("lan.json")) {
                return null;
              }
              if (fileName.includes("tpl/")) {
                let fn = fileName.split("tpl/")[1];
                fileName = fn.replace(".tpl", ".html");
                return fileName;
              } else {
                return fileName;
              }
            } else {
              return fileName;
            }
          })
          .filter(Boolean);
        for (let i = 0; i < fileNames.length; i++) {
          const fileName = fileNames[i];
          fileNameArr.push(fileName.replace("templates/new-template/", ""));
        }
      } catch (error) {
        console.error(`执行Git命令时出错: ${error.message}`);
      }
    });
    fileNameArr = Array.from(new Set(fileNameArr));
    return fileNameArr;
  };
  for (const lanName in folderList) {
    if (onlyLan?.length && !onlyLan.includes(lanName)) continue;
    const lanPath = folderList[lanName];
    let commitList = [],
      last = -1;
    const curCommit = data[lanName];
    if (curCommit) {
      if (curCommit.includes("-")) {
        last = Number(curCommit);
      } else {
        commitList = curCommit.split(",");
        allData[lanName] = getAllCommitName(commitList, lanPath);
        continue;
      }
    }
    try {
      execSync(`git -C ${lanPath} add .`);
      let stdout = execSync(`git -C ${lanPath} diff --cached --name-only`);
      if (!stdout?.length) {
        stdout = execSync(
          `git -C ${lanPath} log ${last} --name-only --pretty=format:`
        );
      }
      const fileNames = stdout
        .toString()
        .split("\n")
        .map((fileName) => {
          if (fileName.includes("/Dev/")) {
            return null;
          }
          if (env === "test") {
            if (fileName.includes("lan.json")) {
              return null;
            }
            if (fileName.includes("tpl/")) {
              let fn = fileName.split("tpl/")[1];
              fileName = fn.replace(".tpl", ".html");
              return fileName;
            } else {
              return fileName;
            }
          } else {
            return fileName;
          }
        })
        .filter(Boolean);
      let fileNameArr = [];
      fileNames.forEach((fileName) => {
        fileNameArr.push(fileName.replace("templates/new-template/", ""));
      });
      fileNameArr = Array.from(new Set(fileNameArr));
      allData[lanName] = fileNameArr;
    } catch (error) {
      console.error(`执行Git命令时出错: ${error.message}`);
    }
  }
  return allData;
}

function handleFtp({ env, data, configs }) {
  outputs = data;
  if (env === "test") {
    testConn = configs.testConn;
    LocalList = configs.LocalListTest;
    devList = configs.testFoldList;
  } else {
    testConn = configs.proConn;
    LocalList = configs.LocalListPro;
    devList = configs.proFoldList;
  }

  const dirs = outputs;

  function bufferToStream(buffer) {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
  }

  async function getRemoteFileSize(sftp, remoteFilePath) {
    const remoteFileInfo = await sftp.stat(remoteFilePath);
    return remoteFileInfo.size;
  }

  function fileHash(readStream) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash("sha256");
      readStream.on("data", (chunk) => {
        hash.update(chunk);
      });
      readStream.on("end", () => {
        resolve(hash.digest("hex"));
      });
      readStream.on("error", (err) => {
        reject(err);
      });
    });
  }

  return new Promise((resolve, reject) => {
    const sftp = new Client();
    let imgHasPath = [];
    sftp
      .connect(testConn)
      .then(async () => {
        errorOccurred1 = false;
        errorOccurred2 = false;
        if (dirs && Object.keys(dirs)?.length) {
          for (const key in dirs) {
            if (errorOccurred1) break;
            let vals = dirs[key];
            for (let i = 0; i < vals.length; i++) {
              if (errorOccurred1) break;
              const dir = vals[i];
              try {
                let localFilePath = `${LocalList[key]}${dir.replace(
                  /\//g,
                  "\\"
                )}`;
                let remoteFilePath = `${devList[key]}${dir}`;
                const lastIndex = remoteFilePath.lastIndexOf("/");
                const prefix = remoteFilePath.substring(0, lastIndex);
                if (!imgHasPath.includes(prefix)) {
                  const exists = await sftp.exists(prefix).catch((e) => {
                    console.log(e);
                  });
                  if (!exists) {
                    await sftp.mkdir(prefix, true);
                  }
                  imgHasPath.push(prefix);
                }
                await sftp.fastPut(localFilePath, remoteFilePath);
                const remoteFileSize = await getRemoteFileSize(
                  sftp,
                  remoteFilePath
                );
                const localFileSize = fs.statSync(localFilePath).size;
                if (remoteFileSize !== localFileSize) {
                  sftp.end();
                  console.log(
                    "文件上传成功，但大小不一致，须重传" + " - " + localFilePath
                  );
                  reject();
                } else {
                  if (
                    localFilePath.endsWith(".js") ||
                    localFilePath.endsWith(".css") ||
                    localFilePath.endsWith(".scss") ||
                    localFilePath.endsWith(".tpl") ||
                    localFilePath.endsWith(".html") ||
                    localFilePath.endsWith(".json")
                  ) {
                    const localFileSizeStream =
                      fs.createReadStream(localFilePath);
                    const remoteStream = await sftp.get(remoteFilePath);
                    const hash1 = await fileHash(localFileSizeStream);
                    const hash2 = await fileHash(bufferToStream(remoteStream));
                    if (hash1 !== hash2) {
                      sftp.end();
                      console.log(
                        "文件上传成功，但内容不一致，须重传" +
                        " - " +
                        localFilePath
                      );
                      reject();
                    }
                  }
                }
              } catch (error) {
                errorOccurred1 = true;
                reject();
              }
            }
          }
        }
        sftp.end();
        resolve();
      })
      .catch((err) => {
        sftp.end();
        reject();
      });
  });
}

module.exports = { getAllFiles, handleFtp };
