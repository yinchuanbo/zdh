var express = require("express");
const getConf = require("../utils/conf");
const { spawn } = require("child_process");
const getFileFunc = require("../utils/get-files");
const { setFile } = require("../utils/set-file");
const deployToFtp = require("../utils/deploy-to-ftp");
const handlePublish = require("../utils/publish");
const pullCode = require("../utils/pull-code");
const pushCode = require("../utils/push-code");
const { copyAndMoveImg, getFileContent } = require("../utils/handle-file");
const { authenticateToken } = require("../permissions");
const path = require("path");
var router = express.Router();

let watchProcess = null;

router.get("/", authenticateToken, function (req, res, next) {
  const { lans } = getConf(req.uname, res);
  res.render("index", {
    title: "Index",
    lans: Object.keys(lans),
    role: req.role,
  });
});

router.get("/watching", authenticateToken, function (req, res, next) {
  const { pathname, lans, ports, domain } = getConf(req.uname, res);
  const isWatching = req.query.bool;
  const watchScriptPath = path.join(__dirname, "../utils", "watch.js");
  watchProcess?.kill?.();
  watchProcess = null;
  if (isWatching === "true") {
    if (!watchProcess) {
      watchProcess = spawn(
        "node",
        [
          watchScriptPath,
          pathname,
          JSON.stringify(lans),
          JSON.stringify(ports),
          domain,
        ],
        {
          stdio: "inherit",
        }
      );
      console.log("Watch process started:", watchProcess.pid);
    } else {
      console.log("Watch process is already running:", watchProcess.pid);
    }
  }
  res.json({
    success: true,
    watchingStatus: isWatching,
    message: isWatching ? "User is watching" : "User is not watching",
  });
});

router.post("/handle-files", authenticateToken, async (req, res) => {
  const configs = getConf(req.uname, res);
  const { init, async, commitIds } = req.body;
  await getFileFunc(init, async, commitIds, configs).then(() => {
    delete require.cache[require.resolve("../utils/output")];
    delete require.cache[require.resolve("../utils/output-other")];
    res.json({
      code: 200,
      message: "数据接收成功",
      data: require("../utils/output")[init],
      data2: require("../utils/output-other"),
    });
  });
});

router.post("/publish", authenticateToken, async (req, res) => {
  const { ports, domain } = getConf(req.uname, res);
  const { lan } = req.body;
  try {
    await handlePublish(lan, ports, domain);
    res.json({
      code: 200,
      message: "publish-success",
    });
  } catch (error) {
    res.json({
      code: 200,
      message: "publish-fail",
    });
  }
});

router.post("/receive-files", authenticateToken, async (req, res) => {
  const { LocalListPro, ports, domain } = getConf(req.uname, res);
  const { path, path2, lan, initLan } = req.body;
  if (path.includes("img/")) {
    try {
      await copyAndMoveImg({ path, lan, initLan, LocalListPro });
      await handlePublish(lan, ports, domain);
      res.json({
        code: 200,
        message: "ok",
      });
    } catch (error) {
      res.json({
        code: 200,
        message: "fail",
      });
    }
  } else {
    const result = await getFileContent({
      path,
      lan,
      initLan,
      path2,
      LocalListPro,
    });
    res.json({
      code: 200,
      message: "processing",
      data: result,
    });
  }
});

router.post("/receive-imgs", authenticateToken, async (req, res) => {
  const { ports, domain } = getConf(req.uname, res);
  const { lan, imgs, initLan } = req.body;
  try {
    for (let i = 0; i < imgs.length; i++) {
      const imgPath = imgs[i];
      await copyAndMoveImg({ path: imgPath, lan, initLan });
    }
    await handlePublish(lan, ports, domain);
    res.json({
      code: 200,
      message: "async-imgs-success",
    });
  } catch (error) {
    res.json({
      code: 200,
      message: "fail",
    });
  }
});

router.post("/set-file", authenticateToken, async (req, res) => {
  const { ports, domain } = getConf(req.uname, res);
  const { path, content, lan } = req.body;
  try {
    await setFile({ path, content });
    if (
      !(path.endsWith(".scss") || path.endsWith(".css") || path.endsWith(".js"))
    ) {
      await handlePublish(lan, ports, domain);
    }
    res.json({
      code: 200,
      message: "complete",
    });
  } catch (error) {
    res.json({
      code: 200,
      message: "nocomplete",
    });
  }
});

router.post("/deploy-to-ftp", authenticateToken, async (req, res) => {
  const configs = getConf(req.uname, res);
  const { lan, data, env } = req.body;
  try {
    await deployToFtp({ lan, data, env, configs });
    res.json({
      code: 200,
      message: "deploy-success",
    });
  } catch (error) {
    res.json({
      code: 200,
      message: "deploy-error",
    });
  }
});

router.post("/pull-code", authenticateToken, async (req, res) => {
  const { localPaths } = getConf(req.uname, res);
  const { lan } = req.body;
  try {
    const result = await pullCode({ lan, localPaths });
    res.json({
      code: 200,
      message: "pull-success",
      data: result,
    });
  } catch (error) {
    res.json({
      code: 200,
      message: "pull-error",
      data: error?.message || error,
    });
  }
});
router.post("/push-code", authenticateToken, async (req, res) => {
  const { localPaths } = getConf(req.uname, res);
  const { lan, commit } = req.body;
  try {
    const result = await pushCode({ lan, commit, localPaths });
    res.json({
      code: 200,
      message: "push-success",
      data: result,
    });
  } catch (error) {
    res.json({
      code: 200,
      message: "push-error",
      data: error?.message || error,
    });
  }
});

module.exports = router;
