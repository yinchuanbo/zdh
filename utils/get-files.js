const { getDynamicFilePath, getRequireDynamicFile } = require("./setData");
const { execSync } = require("child_process");
// Conditional prettier loading for pkg compatibility
let prettier;
try {
  if (process.pkg) {
    // In pkg environment, skip prettier functionality
    prettier = null;
  } else {
    prettier = require("prettier");
  }
} catch (error) {
  prettier = null;
}
const settings = require("./settings");
const fs = require("fs").promises;
const simpleGit = require("simple-git");
const path = require("path");
const diff = require("diff");

const imageExtensions = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".bmp",
  ".svg",
  ".ico",
  ".tiff",
  ".tif",
  ".heic",
  ".avif",
];

function filterFun(fileName) {
  const basicPaths = ["/Dev/", "/lan/", "/img/", "/tpl/"];
  const jsPaths = [
    "/ai-headshot-generator/",
    "/bottom-blog-component/",
    "/bottom-faq-component/",
    "/bottom-message/",
    "/commonSignin/",
    "/confirm-dialog/",
    "/credits/",
    "/faq-content/",
    "/halloween-special/",
    "/pay-dialog/",
    "/popup/",
    "/self-select/",
    "/share-dialog/",
  ];
  return (
    basicPaths.some((path) => fileName.includes(path)) ||
    (fileName.includes("/js/") &&
      !fileName.includes("/Dev/") &&
      jsPaths.some((path) => fileName.includes(path)))
  );
}

function getCurrentBranchName(folderPath) {
  try {
    const branchName = execSync("git rev-parse --abbrev-ref HEAD", {
      cwd: folderPath,
      encoding: "utf-8",
    });
    return branchName.trim();
  } catch (error) {
    console.error(`无法获取分支名: ${error.message}`);
    return null;
  }
}

function getChangedLines(beforeContent, afterContent) {
  const diffResult = diff.diffLines(beforeContent.trim(), afterContent.trim());
  const changedLineNumbers = new Set();

  let beforeLineNumber = 1;
  let afterLineNumber = 1;

  diffResult.forEach((part) => {
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

function isImageFile(filepath) {
  const ext = "." + filepath.split(".").pop().toLowerCase();
  return imageExtensions.includes(ext);
}

async function getStagedFileDiffs({
  execCommand,
  lanPath,
  execType,
  lastCommitId,
}) {
  const git = simpleGit(lanPath);
  try {
    const stdout = execSync(execCommand);
    let stagedFiles = stdout
      .toString()
      .split("\n")
      .filter((file) => file.trim() !== "");
    const obj = {};
    for (const file of stagedFiles) {
      if (
        file && filterFun(file) && !isImageFile(file)) {
        console.log("file", file);
        let beforeContent = "",
          afterContent = "";
        if (execType === "cache") {
          try {
            beforeContent = execSync(`git -C ${lanPath} show HEAD:${file}`, {
              encoding: "utf-8",
            });
            if (prettier) {
              beforeContent = await prettier.format(
                beforeContent,
                settings(file)
              );
            }
          } catch (error) {
            beforeContent = "";
            console.log("error01", error);
          }
          try {
            afterContent = execSync(`git -C ${lanPath} show :${file}`, {
              encoding: "utf-8",
            });
            if (prettier) {
              afterContent = await prettier.format(afterContent, settings(file));
            }
          } catch (error) {
            afterContent = "";
            console.log("error02", error);
          }
        } else if (execType === "last" && lastCommitId) {
          try {
            const status = await git.show([`${lastCommitId}:${file}`]);
            if (status !== "A") {
              try {
                beforeContent = await git.show([`${lastCommitId}^:${file}`]);
                if (prettier) {
                  beforeContent = await prettier.format(
                    beforeContent,
                    settings(file)
                  );
                }
              } catch (error) {
                beforeContent = "";
                console.log("error03", error);
              }
            }
            if (status !== "D") {
              try {
                afterContent = await git.show([`${lastCommitId}:${file}`]);
                if (prettier) {
                  afterContent = await prettier.format(
                    afterContent,
                    settings(file)
                  );
                }
              } catch (error) {
                afterContent = "";
                console.log("error04", error);
              }
            }
          } catch (error) {
            beforeContent = afterContent = "";
          }
        }
        if (beforeContent && afterContent) {
          const changedLines = getChangedLines(beforeContent, afterContent);
          const curKey = path.basename(file);
          if (!obj[curKey]) obj[curKey] = [];
          obj[curKey] = [...obj[curKey], ...changedLines];
        }
      }
    }
    return obj;
  } catch (error) {
    console.error("Error fetching staged file diffs:", error);
  }
}

async function getFileFunc(
  onlyLan = "en",
  asyncLans = [],
  commitIds = "",
  configs
) {
  if (!configs || !configs.localPaths || !configs.LocalListPro) {
    throw new Error("Invalid configuration");
  }

  const folderList = configs.localPaths;
  let allData = {},
    lineObj = null;

  const getAllCommitName = async (commitList, lanPath) => {
    let fileNameArr = [];
    for (const commit of commitList) {
      try {
        const execCommand = `git -C ${lanPath} log --first-parent -1 ${commit} --name-only --pretty=format:`;
        const stdout = await execSync(execCommand);
        lineObj = await getStagedFileDiffs({
          execCommand,
          lanPath,
          execType: "last",
          lastCommitId: commit.slice(0, 8),
        });
        const fileNames = stdout
          .toString()
          .split("\n")
          .filter(filterFun)
          .map((fileName) => fileName.replace("templates/new-template/", ""));
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
    let commitList = [],
      last = -1;
    const curCommit = commitIds;

    if (curCommit) {
      if (curCommit.includes("-")) {
        last = Number(curCommit);
      } else {
        commitList = curCommit.split(",");
        const cData = await getAllCommitName(commitList, lanPath);
        allData[lanName] = cData.filter(Boolean);
        continue;
      }
    }

    try {
      // execSync(`git -C ${lanPath} add .`);
      let execCommand = `git -C ${lanPath} diff --cached --name-only`;
      let execType = "cache";
      let stdout = await execSync(execCommand);
      let lastCommitId = "";
      if (!stdout?.length) {
        execCommand = `git -C ${lanPath} log ${last} --name-only --pretty=format:`;
        execType = "last";
        stdout = await execSync(execCommand);
        lastCommitId = await execSync(
          `git -C ${lanPath}  log ${last} --format=%H"`
        );
        lastCommitId = lastCommitId.toString();
      }
      lineObj = await getStagedFileDiffs({
        execCommand,
        lanPath,
        execType,
        lastCommitId: lastCommitId.slice(0, 8),
      });
      const fileNames = stdout
        .toString()
        .split("\n")
        .filter(filterFun)
        .map((fileName) => fileName.replace("templates/new-template/", ""));
      const cData = Array.from(new Set(fileNames));
      allData[lanName] = cData.filter(Boolean);
    } catch (error) {
      console.error(`执行Git命令时出错: ${error.message}`);
    }
  }
  const cbObj = {};
  for (let i = 0; i < asyncLans.length; i++) {
    const asyncLan = asyncLans[i];
    const lanP = configs.localPaths[asyncLan];
    const cB = getCurrentBranchName(lanP);
    cbObj[asyncLan] = cB;
  }
  await handleAsyncLans(allData[onlyLan], asyncLans, onlyLan, configs);
  const jsContent = `module.exports = ${JSON.stringify(allData, null, 2)};`;
  const outputPath = getDynamicFilePath("output.js");
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, jsContent);
  return { cbObj, lineObj };
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
  console.log("oLan, aLan", oLan, aLan)
  const obj = {};
  for (const al of aLan) {
    const alP = configs.LocalListPro[al];
    console.log("alP", alP);
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

  const outputOtherPath = getDynamicFilePath("output-other.js");
  await fs.mkdir(path.dirname(outputOtherPath), { recursive: true });
  await fs.writeFile(outputOtherPath, jsContent);
}

module.exports = { getFileFunc, getRequireDynamicFile, getDynamicFilePath };
