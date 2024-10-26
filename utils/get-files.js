const { getDynamicFilePath, getRequireDynamicFile } = require("./setData")
const { execSync } = require("child_process");
const prettier = require("prettier");
const settings = require("./settings");
const fs = require("fs").promises;
const path = require("path");
const diff = require('diff');

function getCurrentBranchName(folderPath) {
  try {
    const branchName = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: folderPath,
      encoding: 'utf-8'
    });
    return branchName.trim();
  } catch (error) {
    console.error(`无法获取分支名: ${error.message}`);
    return null;
  }
}

function getChangedLines(beforeContent, afterContent) {
  console.log('beforeContent', beforeContent.length)
  console.log('afterContent', afterContent.length)
  const diffResult = diff.diffLines(beforeContent, afterContent);
  const changedLineNumbers = new Set();

  let beforeLineNumber = 1;
  let afterLineNumber = 1;

  diffResult.forEach(part => {
    if (part.added) {
      changedLineNumbers.add(afterLineNumber);
      afterLineNumber += part.count || 0;
    } else if (part.removed) {
      changedLineNumbers.add(beforeLineNumber);
      beforeLineNumber += part.count || 0;
    } else {
      beforeLineNumber += part.count || 0;
      afterLineNumber += part.count || 0;
    }
  });
  return Array.from(changedLineNumbers);
}

async function getStagedFileDiffs(lanPath) {
  try {
    const stdout = execSync(`git -C ${lanPath} diff --cached --name-only`);
    const stagedFiles = stdout.toString().split("\n").filter(file => file.trim() !== '');
    const obj = {};
    for (const file of stagedFiles) {
      if (file && !(file.includes("/img/") || file.includes("\\img\\"))) {
        const previousContent = execSync(`git -C ${lanPath} show HEAD:${file}`, { encoding: 'utf-8' });
        const formattedPreviousContent = await prettier.format(previousContent, settings(file));
        const stagedContent = execSync(`git -C ${lanPath} show :${file}`, { encoding: 'utf-8' });
        const formattedstagedContent = await prettier.format(stagedContent, settings(file));
        const changedLines = getChangedLines(formattedPreviousContent, formattedstagedContent);
        obj[path.basename(file)] = changedLines;
      }
    }
    return obj;
  } catch (error) {
    console.error('Error fetching staged file diffs:', error.message);
  }
}
async function getFileFunc(onlyLan = "en", asyncLans = [], commitIds = "", configs) {
  if (!configs || !configs.localPaths || !configs.LocalListPro) {
    throw new Error("Invalid configuration");
  }

  const folderList = configs.localPaths;
  let allData = {}, lineObj = null;

  const getAllCommitName = async (commitList, lanPath) => {
    let fileNameArr = [];
    for (const commit of commitList) {
      try {
        const stdout = await execSync(
          `git -C ${lanPath} log --first-parent -1 ${commit} --name-only --pretty=format:`
        );
        const fileNames = stdout
          .toString()
          .split("\n")
          .filter(fileName =>
            fileName.includes("/Dev/") || fileName.includes("/lan/") || fileName.includes("/img/") || fileName.includes("/tpl/")
          )
          .map(fileName => fileName.replace("templates/new-template/", ""));
        fileNameArr.push(...fileNames);
      } catch (error) {
        console.error(`执行Git命令时出错: ${error.message}`);
      }
    }
    return Array.from(new Set(fileNameArr));
  };

  for (const lanName in folderList) {
    if (onlyLan?.length && !onlyLan.includes(lanName)) continue;
    const lanPath = folderList[lanName];
    let commitList = [], last = -1;
    const curCommit = commitIds;

    if (curCommit) {
      if (curCommit.includes("-")) {
        last = Number(curCommit);
      } else {
        commitList = curCommit.split(",");
        const cData = await getAllCommitName(commitList, lanPath)
        allData[lanName] = cData.filter(Boolean);
        continue;
      }
    }

    try {
      // execSync(`git -C ${lanPath} add .`);
      let stdout = await execSync(`git -C ${lanPath} diff --cached --name-only`);
      if (!stdout?.length) {
        stdout = await execSync(`git -C ${lanPath} log ${last} --name-only --pretty=format:`);
      } else {
        lineObj = await getStagedFileDiffs(lanPath);
      }
      const fileNames = stdout
        .toString()
        .split("\n")
        .filter(fileName =>
          fileName.includes("/Dev/") || fileName.includes("/lan/") || fileName.includes("/img/") || fileName.includes("/tpl/")
        )
        .map(fileName => fileName.replace("templates/new-template/", ""));
      const cData = Array.from(new Set(fileNames));
      allData[lanName] = cData.filter(Boolean);
    } catch (error) {
      console.error(`执行Git命令时出错: ${error.message}`);
    }
  }
  const cbObj = {};
  for (let i = 0; i < asyncLans.length; i++) {
    const asyncLan = asyncLans[i];
    const lanP = configs.localPaths[asyncLan]
    const cB = getCurrentBranchName(lanP)
    cbObj[asyncLan] = cB;
  }
  await handleAsyncLans(allData[onlyLan], asyncLans, onlyLan, configs);
  const jsContent = `module.exports = ${JSON.stringify(allData, null, 2)};`;
  const outputPath = getDynamicFilePath('output.js');
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, jsContent);
  return {cbObj, lineObj}
}

async function findTplFiles(dirPath) {
  const tplFiles = [];
  const files = await fs.readdir(dirPath);
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      tplFiles.push(...(await findTplFiles(filePath)));
    } else if (path.extname(file) === ".tpl") {
      tplFiles.push(filePath);
    }
  }
  return tplFiles;
}

async function checkLinkHrefInTplFiles(tplFiles, url) {
  const matchingFiles = [];
  for (const file of tplFiles) {
    const content = await fs.readFile(file, "utf-8");
    const linkRegex = /<link[^>]+href="([^"]+)"/g;
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const href = match[1];
      if (href.includes(url)) {
        matchingFiles.push(path.basename(file));
        break;
      }
    }
  }
  return matchingFiles;
}

async function handleAsyncLans(oLan, aLan, onlyLan, configs) {
  const obj = {};
  for (const al of aLan) {
    const alP = configs.LocalListPro[al];
    console.log('alP', alP)
    obj[al] = {};
    for (const ol of oLan) {
      if (ol.endsWith(".tpl") && ol.split("/").length === 2) {
        const name = path.basename(ol);
        const curPath = path.dirname(ol);
        const url = `https://${onlyLan === "en" ? "www" : onlyLan}.vidnoz.com/${name.replace(".tpl", ".html")}`;
        const allP = alP + "tpl";
        const tplFiles = await findTplFiles(allP);
        const matchingFiles = await checkLinkHrefInTplFiles(tplFiles, url);
        if (matchingFiles.length > 0) {
          obj[al][ol] = `${curPath}/${matchingFiles[0]}`;
        }
      } else {
        obj[al][ol] = ol;
      }
    }
  }
  const jsContent = `module.exports = ${JSON.stringify(obj, null, 2)};`;

  const outputOtherPath = getDynamicFilePath('output-other.js');
  await fs.mkdir(path.dirname(outputOtherPath), { recursive: true });
  await fs.writeFile(outputOtherPath, jsContent);
}

module.exports = { getFileFunc, getRequireDynamicFile, getDynamicFilePath };