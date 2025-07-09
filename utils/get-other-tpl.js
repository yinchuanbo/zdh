const fs = require("fs").promises;
const fs2 = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const https = require('https');
const axios = require("axios");

const agent = new https.Agent({  
  rejectUnauthorized: false // 忽略证书验证（不安全！）
});


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
  console.log("curPath", curPath);
  // 读取 .tpl 文件内容
  const tplContent = fs2.readFileSync(curPath, "utf-8");
  // 更宽松的正则表达式匹配 <script> 和 <link> 标签
  const jsRegex =
    /<script(?=(?:[^>]*?\s+(?:src|type|async|defer|charset|crossorigin|integrity|nomodule|nonce|referrerpolicy)(?:=["'][^"']*?["'])?)*?\s+src=["']([^"']+)["'])(?:[^>]*?type=["'](?:text\/javascript|application\/javascript|module)["'])?[^>]*>(?:<\/script>)?/gi;
  const cssRegex =
    /<link(?=(?:[^>]*?\s+(?:href|rel|type|media|crossorigin|integrity|referrerpolicy)(?:=["'][^"']*?["'])?)*?\s+(?:href=["']([^"']+?\.css(?:\?[^"']*?)?))["'])(?:[^>]*?rel=["']stylesheet["'])[^>]*?\/?>/gi;
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
      jsPath.includes("swiper.min") ||
      jsPath.includes("lottie-player") ||
      !jsPath.includes("js/")
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
      cssPath.includes("swiper.min") ||
      !cssPath.includes("css/")
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

async function getAlternateLinksFromUrl(url) {
  try {
    const response = await axios.get(url, { 
      httpsAgent: agent 
    });
    const html = response.data;
    const $ = cheerio.load(html);
    const hrefs = {};
    $('link[rel="alternate"]').each((i, element) => {
      const href = $(element).attr("href");
      let hreflang = ($(element).attr("hreflang") || "").trim();
      if (hreflang === "zh-Hant") hreflang = "tw";
      if (hreflang === "ko") hreflang = "kr";
      if (hreflang === "ja") hreflang = "jp";
      if (href && hreflang !== "x-default") {
        hrefs[hreflang] = path.basename(href).replaceAll(".html", ".tpl");
      }
    });

    return hrefs;
  } catch (error) {
    console.error("Error fetching the URL:", error);
    return [];
  }
}

async function getOtherTpl({ url, configs }) {
  const resss = await getAlternateLinksFromUrl(url);
  console.log("resss", resss)
  const lans = Object.keys(configs.lans);
  let urls = {};
  let otherUrls = {};
  for (let i = 0; i < lans.length; i++) {
    let lan = lans[i];
    const curResss = resss[lan];
    const alP = configs.LocalListPro[lan];
    const matchingFiles = curResss ? [curResss] : [];
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
