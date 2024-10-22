const settings = require("./settings");
const prettier = require("prettier");
const pathModule = require("path");
const fs = require("fs");
const fs2 = require('fs').promises;

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
  const nowC = fs.readFileSync(nowPath, { encoding: "utf-8", flag: "rs" });
  const initC = fs.readFileSync(initPath, { encoding: "utf-8", flag: "rs" });

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

  if (path.endsWith(".json")) {
    setInfo = settings("json");
  }

  let formattedinitC, formattednowC;

  try {
    formattedinitC = await prettier.format(initC, setInfo);
    formattednowC = await prettier.format(nowC, setInfo);
  } catch (error) {
    formattedinitC = initC;
    formattednowC = nowC;
  }

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

async function deleteFile({ lan, path2, LocalListPro }) {
  const dPath = LocalListPro[lan] + path2.replaceAll("/", "\\");
  console.log('dPath', dPath)
  try {
    await fs2.unlink(dPath);
    return ''
  } catch (err) {
    console.log('skdjfskjdfsdf', err)
    return Promise.reject(err)
  }
}

module.exports = {
  copyAndMoveImg,
  getFileContent,
  deleteFile
};
