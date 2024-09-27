const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function getFileFunc(onlyLan = "en", asyncLans = [], commitIds = "", configs) {
  const folderList = configs.localPaths;
  let allData = {};

  const getAllCommitName = (commitList = [], lanPath = "") => {
    console.log("lanPath", lanPath);
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
            if (
              (fileName.endsWith(".js") ||
                fileName.endsWith(".scss") ||
                fileName.endsWith(".css")) &&
              !fileName.includes("/Dev/")
            ) {
              return null;
            }
            return fileName;
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
    const curCommit = commitIds;
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
          if (
            (fileName.endsWith(".js") ||
              fileName.endsWith(".scss") ||
              fileName.endsWith(".css")) &&
            !fileName.includes("/Dev/")
          ) {
            return null;
          }
          return fileName;
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

  handleAsyncLans(allData[onlyLan], asyncLans, onlyLan, configs);

  const jsContent = `module.exports = ${JSON.stringify(allData, null, 2)};`;
  fs.writeFileSync("./utils/output.js", jsContent);
  return Promise.resolve();
}

function findTplFiles(dirPath) {
  let tplFiles = [];
  fs.readdirSync(dirPath).forEach((file) => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      tplFiles = tplFiles.concat(findTplFiles(filePath));
    } else if (path.extname(file) === ".tpl") {
      tplFiles.push(filePath);
    }
  });
  return tplFiles;
}

function checkLinkHrefInTplFiles(tplFiles, url) {
  const matchingFiles = [];
  tplFiles.forEach((file) => {
    const content = fs.readFileSync(file, "utf-8");
    const linkRegex = /<link[^>]+href="([^"]+)"/g;
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const href = match[1];
      if (href.includes(url)) {
        matchingFiles.push(path.basename(file));
        break;
      }
    }
  });

  return matchingFiles;
}

function handleAsyncLans(oLan, aLan, onlyLan, configs) {
  const obj = {};
  for (let j = 0; j < aLan.length; j++) {
    const al = aLan[j];
    const alP = configs.LocalListPro[al];
    for (let i = 0; i < oLan.length; i++) {
      const ol = oLan[i];
      if (ol.endsWith(".tpl") && ol.split("/").length === 2) {
        const name = path.basename(ol);
        const curPath = path.dirname(ol);
        const url = `https://${onlyLan === "en" ? "www" : onlyLan}.vidnoz.com/${name.replace(".tpl", ".html")}`;
        const allP = alP + "tpl";
        const tplFiles = findTplFiles(allP);
        const matchingFiles = checkLinkHrefInTplFiles(tplFiles, url);
        if (matchingFiles.length > 0) {
          if (!obj[al]) {
            obj[al] = {};
          }
          obj[al][ol] = `${curPath}/${matchingFiles[0]}`;
        }
      } else {
        if (!obj[al]) {
          obj[al] = {};
        }
        obj[al][ol] = ol;
      }
    }
  }
  const jsContent = `module.exports = ${JSON.stringify(obj, null, 2)};`;
  fs.writeFileSync("./utils/output-other.js", jsContent);
}

module.exports = getFileFunc;
