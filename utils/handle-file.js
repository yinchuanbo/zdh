const settings = require("./settings");
const prettier = require("prettier");
const pathModule = require("path");
const fs = require("fs");

function copyAndMoveImg({ path, lan, initLan, LocalListPro }) {
  const initPath = LocalListPro[initLan] + path.replaceAll("/", "\\");
  const nowPath = LocalListPro[lan] + path.replaceAll("/", "\\");
  try {
    fs.copyFileSync(initPath, nowPath);
    return Promise.resolve();
  } catch (error) {
    return Promise.reject();
  }
}

async function getFileContent({ path, lan, initLan, path2, LocalListPro }) {
  const initPath = LocalListPro[initLan] + path.replaceAll("/", "\\");
  const nowPath = LocalListPro[lan] + path2.replaceAll("/", "\\");

  if (!fs.existsSync(nowPath)) {
    const dir = pathModule.dirname(nowPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.copyFileSync(initPath, nowPath);
  }

  const initC = fs.readFileSync(initPath, "utf-8");
  const nowC = fs.readFileSync(nowPath, "utf-8");

  let setInfo = {};

  if (path.endsWith(".js")) {
    setInfo = settings();
  }

  if (path.endsWith(".tpl")) {
    setInfo = settings("html");
  }

  if (path.endsWith(".css")) {
    setInfo = settings("css");
  }

  if (path.endsWith(".scss")) {
    setInfo = settings("scss");
  }
  const formattedinitC = await prettier.format(initC, setInfo);
  const formattednowC = await prettier.format(nowC, setInfo);

  return {
    initC: {
      path: initPath,
      content: formattedinitC,
    },
    nowC: {
      path: nowPath,
      content: formattednowC,
    },
  };
}

module.exports = {
  copyAndMoveImg,
  getFileContent,
};
