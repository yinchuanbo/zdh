const chokidar = require("chokidar");
const { minify } = require("terser");
const https = require("https");
const axios = require("axios");
const fs = require("fs").promises;
const fs2 = require("fs");
const path = require("path");
const sass = require("node-sass");
const io = require("socket.io-client");

let [, , pathname, lans, ports, domain] = process.argv;

lans = JSON.parse(lans);
ports = JSON.parse(ports);

const socket = io("http://localhost:3000");

let allDirs = {};

function handleError(err, file = "") {
  socket.emit("chat message", {
    type: "watch error",
    message: err?.message || "未知错误",
    file,
  });
  process.exit(1);
}

process.on("uncaughtException", (err) => {
  console.error("未捕获的异常:", err);
  handleError(err);
});

const args = process.argv.slice(2);

const compressAndObfuscate = async (filePath, jsOutputDir) => {
  try {
    const fileContent = await fs.readFile(filePath, "utf-8");
    const minified = await minify(fileContent);
    await fs.writeFile(
      path.join(jsOutputDir, path.basename(filePath)),
      minified.code
    );
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
};

const compileSCSS = (filePath, cssOutputDir) => {
  return new Promise((resolve, reject) => {
    const outputFilePath = path.join(
      cssOutputDir,
      path.basename(filePath).replace(".scss", ".css")
    );
    sass.render(
      {
        file: filePath,
        outputStyle: "compressed",
        outFile: outputFilePath,
      },
      (error, result) => {
        if (!error) {
          fs.writeFile(outputFilePath, result.css)
            .then(() => {
              resolve();
            })
            .catch((error) => {
              reject(error);
            });
        } else {
          reject(error);
        }
      }
    );
  });
};

const getAllJsFiles = (dir, fileList = [], type = "js") => {
  const files = fs2.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    // const stat = fs2.statSync(filePath);
    if (file.endsWith(`.${type}`)) {
      fileList.push(filePath);
    }
  });
  return fileList;
};

if (args?.length) {
  const argsArr = args?.[0]?.split("-");
  const lan = argsArr?.[0];
  const type = argsArr?.[1];
  if (lan && type) {
    const sourceDir = `${pathname}\\${lans[lan]}\\templates\\new-template\\Dev\\${type}`;
    const outputDir = `${pathname}\\${lans[lan]}\\templates\\new-template\\${type}`;
    const Files = getAllJsFiles(sourceDir, [], type);
    Files.forEach(async (file) => {
      if (type === "js") {
        await compressAndObfuscate(file, outputDir).catch((err) => {
          handleError(err, file);
        });
      }
      if (type === "scss") {
        await compileSCSS(file, outputDir).catch((err) => {
          handleError(err, file);
        });
      }
    });
    return;
  }
}

function getAllSubfolders(folderPath) {
  return fs2
    .readdirSync(folderPath)
    .filter((file) => fs2.statSync(path.join(folderPath, file)).isDirectory());
}

for (const key in lans) {
  if (Object.hasOwnProperty.call(lans, key)) {
    const element = lans[key];
    const folderPath = `${pathname}\\${element}\\templates\\new-template\\img`;
    const subfolders = getAllSubfolders(folderPath);
    let imgs = [];
    for (let i = 0; i < subfolders.length; i++) {
      const subfolder = subfolders[i] + "";
      imgs.push(
        `${pathname}\\${element}\\templates\\new-template\\img\\${subfolder}`
      );
    }
    allDirs[key] = {
      jsSourceDir: `${pathname}\\${element}\\templates\\new-template\\Dev\\js`,
      jsOutputDir: `${pathname}\\${element}\\templates\\new-template\\js`,
      scssSourceDir: `${pathname}\\${element}\\templates\\new-template\\Dev\\scss`,
      cssOutputDir: `${pathname}\\${element}\\templates\\new-template\\css`,
      tpl: `${pathname}\\${element}\\templates\\new-template\\tpl`,
      lan: `${pathname}\\${element}\\templates\\new-template\\lan`,
      img: `${pathname}\\${element}\\templates\\new-template\\img`,
      imgs,
      publish: `https://${domain}:${ports[key]}/admin/preview/publish`,
    };
  }
}

const publish = (str = "") => {
  if (!str) return;
  const agent = new https.Agent({
    rejectUnauthorized: false,
  });
  axios
    .get(str, {
      httpsAgent: agent,
    })
    .then((res) => {
      if (res.data.code == 200) {
        socket.emit("chat message", {
          type: "publish success",
        });
      } else {
        socket.emit("chat message", {
          type: "publish error",
        });
      }
    })
    .catch(() => {
      console.log("publish失败");
    });
};

for (const key in allDirs) {
  if (Object.hasOwnProperty.call(allDirs, key)) {
    const dir = allDirs[key];
    const watcher = chokidar.watch(
      [dir.jsSourceDir, dir.scssSourceDir, dir.tpl, dir.lan],
      {
        ignoreInitial: true,
      }
    );
    watcher.on("change", async (filePath) => {
      if (filePath.endsWith(".js")) {
        await compressAndObfuscate(filePath, dir.jsOutputDir).catch((err) => {
          handleError(err, filePath);
        });
      } else if (filePath.endsWith(".scss")) {
        await compileSCSS(filePath, dir.cssOutputDir).catch((err) => {
          handleError(err, filePath);
        });
      }
      publish(dir.publish);
    });
  }
}

console.log("正在监听文件更改...");
