const Client = require("ssh2-sftp-client");
const fs = require("fs");
const crypto = require("crypto");
const { Readable } = require("stream");

let errorOccurred1,
  errorOccurred2,
  testConn = null,
  LocalList = null,
  devList = null;

async function deployToFtp({ lan = "", data = [], env = "test", configs }) {
  const outputs = {
    [lan]: data,
  };
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
      .catch(() => {
        sftp.end();
        reject();
      });
  });
}

module.exports = deployToFtp;
