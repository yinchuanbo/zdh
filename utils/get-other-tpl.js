const fs = require("fs").promises;
const fs2 = require("fs");
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

function getIncludedFiles(curPath) {
  // 读取 .tpl 文件内容
  const tplContent = fs2.readFileSync(curPath, "utf-8");
  // 更宽松的正则表达式匹配 <script> 和 <link> 标签
  const jsRegex = /<script[^>]*\s+src=["']([^"']+)["'][^>]*><\/script>/gi;
  const cssRegex =
    /<link[^>]*\s+rel=["']stylesheet["'][^>]*\s+href=["']([^"']+\.css(?:\?[^"']*)?)["'][^>]*>/gi;
  const jsFiles = [];
  const cssFiles = [];
  // 提取 .js 文件路径
  let jsMatch;
  while ((jsMatch = jsRegex.exec(tplContent)) !== null) {
    let jsPath = jsMatch[1];
    if (
      jsPath.includes("jquery") ||
      jsPath.includes("face-api") ||
      jsPath.includes("gsap.") ||
      jsPath.includes("swiper-bundle") ||
      !jsPath.startsWith("./")
    ) {
      continue;
    }
    if (jsPath.startsWith("./")) jsPath = jsPath.replace("./", "");
    jsFiles.push(jsPath);
  }
  // 提取 .css 文件路径
  let cssMatch;
  while ((cssMatch = cssRegex.exec(tplContent)) !== null) {
    let cssPath = cssMatch[1];
    if (
        cssPath.includes("jquery") ||
        cssPath.includes("face-api") ||
        cssPath.includes("gsap.") ||
        cssPath.includes("swiper-bundle") ||
        !cssPath.startsWith("./")
      ) {
        continue;
      }
    if (cssPath.startsWith("./")) cssPath = cssPath.replace("./", "");
    cssFiles.push(cssPath);
  }
  // 处理相对路径并去除查询字符串
  const baseDir = path.dirname(curPath);
  const absoluteJsFiles = jsFiles.map((file) => file.split("?")[0]); // 去除查询字符串
  const absoluteCssFiles = cssFiles.map((file) => file.split("?")[0]); // 去除查询字符串
  return {
    jsFiles: [...new Set(absoluteJsFiles)],
    cssFiles: [...new Set(absoluteCssFiles)],
  };
}

async function getOtherTpl({ url, configs }) {
  const lans = Object.keys(configs.lans);
  let urls = {};
  let otherUrls = {};
  for (let i = 0; i < lans.length; i++) {
    let lan = lans[i];
    const alP = configs.LocalListPro[lan];
    const allP = alP + "tpl";
    const tplFiles = await findTplFiles(allP);
    const matchingFiles = await checkLinkHrefInTplFiles(tplFiles, url);
    if (matchingFiles.length > 0) {
      const curP = path.join(alP, "tpl", matchingFiles[0]);
      const includesPath = getIncludedFiles(curP);
      urls[lan] = `${matchingFiles[0].replaceAll(".tpl", ".html")}`;
      otherUrls[lan] = includesPath;
    }
  }
  return { urls, otherUrls };
}

module.exports = getOtherTpl;
