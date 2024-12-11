const fs = require("fs").promises;
const path = require("path");

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

async function getOtherTpl({ url, configs }) {
  const lans = Object.keys(configs.lans);
  let urls = {};
  for (let i = 0; i < lans.length; i++) {
    let lan = lans[i];
    const alP = configs.LocalListPro[lan];
    const allP = alP + "tpl";
    const tplFiles = await findTplFiles(allP);
    const matchingFiles = await checkLinkHrefInTplFiles(tplFiles, url);
    if (matchingFiles.length > 0) {
      urls[lan] = `${matchingFiles[0].replaceAll(".tpl", ".html")}`;
    }
  }
  return urls
}

module.exports = getOtherTpl;
