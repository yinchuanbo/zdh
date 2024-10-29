const settings = require("./settings");
const prettier = require("prettier");
const pathModule = require("path");
const { execSync, exec } = require("child_process");
const fs = require("fs");
const fs2 = require("fs").promises;
const os = require("os");

function copyAndMoveImg({ path, lan, initLan, LocalListPro }) {
  const initPath = LocalListPro[initLan] + path.replaceAll("/", "\\");
  const nowPath = LocalListPro[lan] + path.replaceAll("/", "\\");

  if (!fs.existsSync(initPath)) {
    throw new Error(initPath + " 文件不存在");
  }

  try {
    fs.copyFileSync(initPath, nowPath);
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
}

async function getFileContent({ path, lan, initLan, path2, LocalListPro }) {
  const initPath = LocalListPro[initLan] + path.replaceAll("/", "\\");
  const nowPath = LocalListPro[lan] + path2.replaceAll("/", "\\");

  if (!fs.existsSync(initPath)) {
    throw new Error(initPath + " 文件不存在");
  }

  if (!fs.existsSync(nowPath)) {
    const dir = pathModule.dirname(nowPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.copyFileSync(initPath, nowPath);
  }
  const nowC = fs.readFileSync(nowPath, { encoding: "utf-8", flag: "rs" });
  const initC = fs.readFileSync(initPath, { encoding: "utf-8", flag: "rs" });

  let setInfo = settings(path);
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
  console.log("dPath", dPath);
  try {
    await fs2.unlink(dPath);
    return "";
  } catch (err) {
    console.log("skdjfskjdfsdf", err);
    return Promise.reject(err);
  }
}

async function openVsCode({ lan, localPaths }) {
  const dPath = localPaths[lan];
  try {
    const stdout = execSync(`code ${dPath}`, { stdio: "inherit" });
    return Promise.resolve();
  } catch (err) {
    return Promise.reject(err);
  }
}

function openUrl(url) {
  const platform = os.platform();

  let command;

  if (platform === "win32") {
    // Windows 使用 'start' 命令
    command = `start ${url}`;
  } else if (platform === "darwin") {
    // macOS 使用 'open' 命令
    command = `open ${url}`;
  } else if (platform === "linux") {
    // Linux 使用 'xdg-open' 命令
    command = `xdg-open ${url}`;
  } else {
    console.error("Unsupported platform:", platform);
    return;
  }

  exec(command, (error) => {
    if (error) {
      console.error("Failed to open URL:", error);
    } else {
      console.log(`Opened ${url} in the default browser`);
    }
  });
}

async function openSite({ lan, ports, domain }) {
  const port = ports[lan];
  try {
    return Promise.resolve(`https://${domain}:${port}/preview`);
  } catch (err) {
    return Promise.reject(err);
  }
}

module.exports = {
  copyAndMoveImg,
  getFileContent,
  deleteFile,
  openVsCode,
  openSite,
};
