var express = require("express");
const getConf = require("../utils/conf");
const { outputRead, outputOtherRead } = require("../utils/supabase")
const { getFileFunc } = require("../utils/get-files");
const { setFile } = require("../utils/set-file");
const deployToFtp = require("../utils/deploy-to-ftp");
const listenWatch = require("../utils/watch");
const handlePublish = require("../utils/publish");
const pullCode = require("../utils/pull-code");
const checkStaus = require("../utils/check-status");
const pushCode = require("../utils/push-code");
const discardCode = require("../utils/discard-code");
const mergeCode = require("../utils/merge-code");
const getBranchs = require("../utils/get-branchs");
const RTLConverter = require("../utils/switch-css-ar");
const allPush = require("../utils/all-push");
const getOtherTpl = require("../utils/get-other-tpl");
const sync = require("../utils/sync");
const io = require("socket.io-client");

const {
  copyAndMoveImg,
  getFileContent,
  deleteFile,
  openVsCode,
  openSite,
} = require("../utils/handle-file");
const { authenticateToken } = require("../permissions");
var router = express.Router();

imageExtensions = [
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

const socket = io(process.env.SOCKER_URL);

router.get("/", authenticateToken, async function (req, res, next) {
  const { lans } = await getConf(req.uname, res, req.user.id);
  res.render("index", {
    title: "Index",
    lans: Object.keys(lans),
    role: req.role,
  });
});

router.get("/watching", authenticateToken, async function (req, res, next) {
  const { pathname, lans, ports, domain } = await getConf(req.uname, res, req.user.id);
  const isWatching = req.query.bool === "true";

  res.app.locals.isW = isWatching;

  if (isWatching) {
    listenWatch(
      isWatching,
      pathname,
      JSON.stringify(lans),
      JSON.stringify(ports),
      domain
    );
    res.json({
      code: 200,
      watchingStatus: true,
      message: "watching",
    });
  } else {
    listenWatch(isWatching);
    res.json({
      code: 200,
      watchingStatus: false,
      message: "not watching",
    });
  }
});

router.post("/handle-files", authenticateToken, async (req, res) => {
  const configs = await getConf(req.uname, res, req.user.id);
  const { init, async, commitIds, url } = req.body;
  try {
    const { cbObj, lineObj } = await getFileFunc(
      init,
      async,
      commitIds,
      configs,
      req
    );
    const output = await outputRead(req.user.id);
    const outputOther = await outputOtherRead(req.user.id)
    res.json({
      code: 200,
      message: "handle-files-success",
      data: output[init],
      data2: outputOther,
      data3: cbObj || {},
      data4: lineObj || {},
    });
  } catch (error) {
    console.log("error", error)
    res.json({
      code: 200,
      message: "handle-files-fail",
      data: error?.message || error || "获取数据失败",
    });
  }
});

router.post("/get-urls", authenticateToken, async (req, res) => {
  const configs = await getConf(req.uname, res, req.user.id);
  const { url } = req.body;
  try {
    const result = await getOtherTpl({
      url,
      configs,
    });
    console.log("result", result)
    res.json({
      code: 200,
      message: "get-urls-success",
      data: result?.urls,
      data2: result?.otherUrls,
    });
  } catch (error) {
    console.log("sdfdsfsdfds", error)
    res.json({
      code: 200,
      message: "get-urls-fail",
      data: error?.message || error || "获取数据失败",
    });
  }
});

router.post("/publish", authenticateToken, async (req, res) => {
  const { ports, domain } = await getConf(req.uname, res, req.user.id);
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
      data: error || error?.message || "Publish 失败",
    });
  }
});

router.post("/switch-css-ar", authenticateToken, async (req, res) => {
  const { csscode } = req.body;
  try {
    const rtlContent = await RTLConverter(csscode);
    res.json({
      code: 200,
      message: "switch-code-success",
      data: rtlContent,
    });
  } catch (error) {
    res.json({
      code: 200,
      message: "switch-code-fail",
      data: error?.message || error,
    });
  }
});

router.post("/oneclick-sync", authenticateToken, async (req, res) => {
  const { LocalListPro, localPaths } = await getConf(req.uname, res, req.user.id);
  const { init, data, data2 } = req.body;

  const result = {};
  data.forEach((path) => {
    const key = `${LocalListPro[init]}${path}`.replaceAll("/", "\\");
    result[key] = [];
    for (const lang in data2) {
      if (data2[lang][path]) {
        result[key].push(
          `${LocalListPro[lang]}${data2[lang][path]}`.replaceAll("/", "\\")
        );
      }
    }
  });

  console.log("result", result);

  sync({
    result,
    init,
    localPaths,
    LocalListPro,
    data,
    data2,
    targetLans: Object.keys(data2),
  });

  // try {
  //   const converter = new RTLConverter();
  //   const rtlContent = await converter.convertStyles(csscode);
  //   res.json({
  //     code: 200,
  //     message: "switch-code-success",
  //     data: rtlContent
  //   });
  // } catch (error) {
  //   res.json({
  //     code: 200,
  //     message: "switch-code-fail",
  //     data: error?.message || error
  //   });
  // }
});

router.post("/all-publish", authenticateToken, async (req, res) => {
  const { lans } = req.body;
  const { ports, domain } = await getConf(req.uname, res, req.user.id);
  let s = [];
  let f = [];
  let errorObj = {};
  let portsObj = {};
  for (let i = 0; i < lans.length; i++) {
    const lan = lans[i];
    portsObj[lan] = ports[lan];
  }
  if (!Object.keys(portsObj)?.length) portsObj = ports;
  async function setPub() {
    for (const key in portsObj) {
      try {
        await handlePublish(key, portsObj, domain);
        s.push(key);
      } catch (error) {
        f.push(key);
        errorObj[key] = error?.message || error;
      }
    }
    return Promise.resolve();
  }
  setPub().then(() => {
    let str = "";
    if (s?.length) {
      str += `${s.join(",")} publish success`;
    }
    if (f?.length) {
      str += `, ${f.join(",")} publish failed`;
    }
    if (Object.keys(errorObj)?.length) {
      str += `\n` + JSON.stringify(errorObj);
    }
    socket.emit("chat message", {
      type: "all-publish",
      message: str,
    });
  });
  res.json({
    code: 200,
    message: "publish-success",
  });
});

router.post("/receive-files", authenticateToken, async (req, res) => {
  const { LocalListPro, ports, domain } = await getConf(req.uname, res, req.user.id);
  const { path, path2, lan, initLan } = req.body;
  function isImageFile(filepath) {
    const ext = "." + filepath.split(".").pop().toLowerCase();
    return imageExtensions.includes(ext);
  }
  if (isImageFile(path)) {
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
        message: "error",
        data: error?.message || error,
      });
    }
  } else {
    try {
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
    } catch (error) {
      res.json({
        code: 200,
        message: "error",
        data: error?.message || error,
      });
    }
  }
});

router.post("/delete-file", authenticateToken, async (req, res) => {
  const { LocalListPro } = await getConf(req.uname, res, req.user.id);
  const { path2, lan } = req.body;
  try {
    await deleteFile({ path2, lan, LocalListPro });
    res.json({
      code: 200,
      message: "delete-success",
      data: "",
    });
  } catch (error) {
    res.json({
      code: 200,
      message: "delete-fail",
      data: error?.message || error,
    });
  }
});

router.post("/open-vscode", authenticateToken, async (req, res) => {
  const configs = await getConf(req.uname, res, req.user.id);
  const { lan } = req.body;
  try {
    await openVsCode({ lan, localPaths: configs.localPaths });
    res.json({
      code: 200,
      message: "open-vscode-success",
      data: "",
    });
  } catch (error) {
    res.json({
      code: 200,
      message: "open-vscode-fail",
      data: error?.message || error,
    });
  }
});

router.post("/open-site", authenticateToken, async (req, res) => {
  const configs = await getConf(req.uname, res, req.user.id);
  const { lan } = req.body;
  try {
    const url = await openSite({
      lan,
      ports: configs.ports,
      domain: configs.domain,
    });
    res.json({
      code: 200,
      data: url,
    });
  } catch (error) {
    res.json({
      code: 200,
      data: "",
    });
  }
});

router.post("/receive-imgs", authenticateToken, async (req, res) => {
  const { LocalListPro, ports, domain } = await getConf(req.uname, res, req.user.id);
  const { lan, imgs, initLan } = req.body;
  try {
    for (let i = 0; i < imgs.length; i++) {
      const imgPath = imgs[i];
      await copyAndMoveImg({ path: imgPath, lan, initLan, LocalListPro });
    }
    await handlePublish(lan, ports, domain);
    res.json({
      code: 200,
      message: "async-imgs-success",
    });
  } catch (error) {
    res.json({
      code: 200,
      message: error?.message || error || "async-imgs-success",
    });
  }
});

router.post("/set-file", authenticateToken, async (req, res) => {
  const { path, content, lan } = req.body;
  try {
    await setFile({ path, content });
    // try {
    //   if (
    //     !(
    //       path.endsWith(".scss") ||
    //       path.endsWith(".css") ||
    //       path.endsWith(".js")
    //     )
    //   ) {
    //     await handlePublish(lan, ports, domain);
    //   }
    // } catch (error) {
    //   throw new Error("Publish 失败");
    // }
    res.json({
      code: 200,
      message: "complete",
    });
  } catch (error) {
    res.json({
      code: 200,
      message: error?.message || error || "nocomplete",
    });
  }
});

router.post("/deploy-to-ftp", authenticateToken, async (req, res) => {
  const configs = await getConf(req.uname, res, req.user.id);
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
      data: error?.message || error,
    });
  }
});

router.post("/pull-code", authenticateToken, async (req, res) => {
  if (res.app.locals.isW) {
    res.json({
      code: 200,
      message: "pull-error",
      data: "请先关闭 Watching",
    });
    return;
  }
  const { localPaths } = await getConf(req.uname, res, req.user.id);
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

router.post("/all-pull", authenticateToken, async (req, res) => {
  if (res.app.locals.isW) {
    res.json({
      code: 200,
      message: "pull-error",
      data: "请先关闭 Watching",
    });
    return;
  }
  const { localPaths, ports } = await getConf(req.uname, res, req.user.id);
  let { lans } = req.body;
  if (!lans?.length) {
    lans = Object.keys(ports);
  }

  // 并发控制函数
  async function runWithConcurrency(tasks, maxConcurrent = 2) {
    const results = [];
    const running = new Set();

    async function runTask(task) {
      running.add(task);
      try {
        const result = await task();
        results.push(result);
      } catch (err) {
        results.push({ error: err });
      } finally {
        running.delete(task);
      }
    }

    const taskQueue = tasks.map((lan) => async () => {
      try {
        await pullCode({ lan, localPaths });
        return { success: true, lan };
      } catch (error) {
        return {
          success: false,
          lan,
          error: error?.message || error,
        };
      }
    });

    while (taskQueue.length > 0 || running.size > 0) {
      while (running.size < maxConcurrent && taskQueue.length > 0) {
        const task = taskQueue.shift();
        runTask(task);
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return results;
  }

  // 执行并发任务
  runWithConcurrency(lans).then((results) => {
    const successful = results.filter((r) => r.success).map((r) => r.lan);
    const failed = results.filter((r) => !r.success).map((r) => r.lan);
    const errors = results
      .filter((r) => !r.success)
      .reduce((acc, r) => ({ ...acc, [r.lan]: r.error }), {});

    let message = "";
    if (successful.length) {
      message += `${successful.join(",")} Pull Success, `;
    }
    if (failed.length) {
      message += `${failed.join(",")} Pull Fail, ${JSON.stringify(errors)}`;
    }

    socket.emit("chat message", {
      type: "all-pull",
      message,
    });
  });

  res.json({
    code: 200,
  });
});

router.post("/all-discard", authenticateToken, async (req, res) => {
  if (res.app.locals.isW) {
    res.json({
      code: 200,
      message: "discard-error",
      data: "请先关闭 Watching",
    });
    return;
  }
  const { localPaths, ports } = await getConf(req.uname, res, req.user.id);
  let { lans } = req.body;
  if (!lans?.length) {
    lans = Object.keys(ports);
  }

  // 并发控制函数
  async function runWithConcurrency(tasks, maxConcurrent = 2) {
    const results = [];
    const running = new Set();

    async function runTask(task) {
      running.add(task);
      try {
        const result = await task();
        results.push(result);
      } catch (err) {
        results.push({ error: err });
      } finally {
        running.delete(task);
      }
    }

    const taskQueue = tasks.map((lan) => async () => {
      try {
        await discardCode({ lan, localPaths, isChecked: true })
        return { success: true, lan };
      } catch (error) {
        return {
          success: false,
          lan,
          error: error?.message || error,
        };
      }
    });

    while (taskQueue.length > 0 || running.size > 0) {
      while (running.size < maxConcurrent && taskQueue.length > 0) {
        const task = taskQueue.shift();
        runTask(task);
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return results;
  }

  // 执行并发任务
  runWithConcurrency(lans).then((results) => {
    const successful = results.filter((r) => r.success).map((r) => r.lan);
    const failed = results.filter((r) => !r.success).map((r) => r.lan);
    const errors = results
      .filter((r) => !r.success)
      .reduce((acc, r) => ({ ...acc, [r.lan]: r.error }), {});

    let message = "";
    if (successful.length) {
      message += `${successful.join(",")} Discard Success, `;
    }
    if (failed.length) {
      message += `${failed.join(",")} Discard Fail, ${JSON.stringify(errors)}`;
    }

    socket.emit("chat message", {
      type: "all-discard",
      message,
    });
  });

  res.json({
    code: 200,
  });
});

router.post("/check-status", authenticateToken, async (req, res) => {
  const { localPaths } = await getConf(req.uname, res, req.user.id);
  const { lan } = req.body;
  try {
    const result = await checkStaus({ lan, localPaths });
    res.json({
      code: 200,
      message: "check-status-success",
      data: result,
    });
  } catch (error) {
    res.json({
      code: 200,
      message: "check-status-error",
      data: error?.message || error,
    });
  }
});

router.post("/push-code", authenticateToken, async (req, res) => {
  const { localPaths } = await getConf(req.uname, res, req.user.id);
  const { lan, commit, status, type } = req.body;
  try {
    const result = await pushCode({ lan, commit, localPaths, status, type });
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

router.post("/all-push", authenticateToken, async (req, res) => {
  const { localPaths } = await getConf(req.uname, res, req.user.id);
  const { lans, commit } = req.body;
  allPush({ lans, commit, localPaths }).then((results) => {
    socket.emit("chat message", {
      type: "all-push",
      message: JSON.stringify(results),
    });
  });
  res.json({
    code: 200,
  });
});

router.post("/discard-code", authenticateToken, async (req, res) => {
  const { localPaths } = await getConf(req.uname, res, req.user.id);
  const { lan, isChecked } = req.body;
  try {
    const result = await discardCode({ lan, localPaths, isChecked });
    res.json({
      code: 200,
      message: "discard-success",
      data: result,
    });
  } catch (error) {
    res.json({
      code: 200,
      message: "discard-error",
      data: error?.message || error,
    });
  }
});

router.post("/get-branchs", authenticateToken, async (req, res) => {
  const { localPaths } = await getConf(req.uname, res, req.user.id);
  const { lan } = req.body;
  try {
    const result = await getBranchs({ lan, localPaths });
    res.json({
      code: 200,
      message: "get-branchs-success",
      data: result,
    });
  } catch (error) {
    res.json({
      code: 200,
      message: "get-branchs-error",
      data: error?.message || error,
    });
  }
});

router.post("/merge-code", authenticateToken, async (req, res) => {
  const { localPaths } = await getConf(req.uname, res, req.user.id);
  const { lan, from, to } = req.body;
  try {
    const result = await mergeCode({ lan, localPaths, from, to });
    res.json({
      code: 200,
      message: "merge-success",
      data: result,
    });
  } catch (error) {
    res.json({
      code: 200,
      message: "merge-error",
      data: error?.message || error,
    });
  }
});

module.exports = router;
