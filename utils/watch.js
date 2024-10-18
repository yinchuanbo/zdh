const chokidar = require("chokidar");
const { minify } = require("terser");
// const csso = require('csso');
const https = require("https");
const axios = require("axios");
const fs = require("fs").promises;
const fs2 = require("fs");
const path = require("path");
const sass = require("sass");
const io = require("socket.io-client");
const babel = require("@babel/core");
const postcss = require("postcss")
const autoprefixer = require("autoprefixer")

const watcherList = [];

let curWatching = false;

function listenWatch(isWatching, pathname, lans, ports, domain) {
  curWatching = isWatching;
  if (watcherList?.length) {
    watcherList.forEach(async (item) => {
      await item.close();
    });
  }
  if (!curWatching) return;
  lans = JSON.parse(lans);
  ports = JSON.parse(ports);
  const socket = io("http://localhost:4000");
  let allDirs = {};

  function handleError(err, file = "") {
    curWatching = false;
    if (watcherList?.length) {
      watcherList.forEach(async (item) => {
        await item.close();
      });
    }
    socket.emit("chat message", {
      type: "watch error",
      message: err?.message || "未知错误",
      file,
    });
  }
  process.on("uncaughtException", (err) => {
    console.error("未捕获的异常:", err);
    handleError(err);
  });

  const compressAndObfuscate = async (filePath, jsOutputDir) => {
    try {
      const fileContent = await fs.readFile(filePath, "utf-8");
      const presetEnvPath = require.resolve("@babel/preset-env");
      let es5Content = await babel.transformAsync(fileContent, {
        presets: [[presetEnvPath]]
      });
      const minified = await minify(es5Content.code);
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
    return new Promise(async (resolve, reject) => {
      const outputFilePath = path.join(
        cssOutputDir,
        path.basename(filePath).replace(".scss", ".css")
      );
      try {
        const result = await sass.compileAsync(filePath, {
          style: "compressed",
        });

        const res = await postcss([autoprefixer]).process(result.css, { from: undefined });


        await fs.writeFile(outputFilePath, res.css);
        resolve(); // 处理成功
      } catch (writeError) {
        reject(writeError); // 写入文件错误
      }
    });
  };

  function getAllSubfolders(folderPath) {
    return fs2
      .readdirSync(folderPath)
      .filter((file) =>
        fs2.statSync(path.join(folderPath, file)).isDirectory()
      );
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
    if (!str || !curWatching) return;
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });
    axios
      .get(str, {
        httpsAgent: agent,
      })
      .then((res) => {
        if (curWatching) {
          if (res.data.code == 200) {
            socket.emit("chat message", {
              type: "publish success",
            });
          } else {
            socket.emit("chat message", {
              type: "publish error",
              message: res.data.message,
            });
          }
        }
      })
      .catch((err) => {
        socket.emit("chat message", {
          type: "publish error",
          message: err?.message || "Publish 失败",
        });
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
        if (!curWatching) return;
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
      watcherList.push(watcher);
    }
  }

  return watcherList;
}

module.exports = listenWatch;
