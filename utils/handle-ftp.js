const { execSync } = require("child_process");
const Client = require("ssh2-sftp-client");
const fs = require("fs");
const crypto = require("crypto");
const { Readable } = require("stream");
const deployToFtp = require("./deploy-to-ftp")

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

async function handleFtp({ env, data, configs }) {
  await deployToFtp({ data, env, configs });
}

module.exports = { getAllFiles, handleFtp };
