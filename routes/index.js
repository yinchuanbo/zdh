var express = require("express");
const getConf = require("../utils/conf");
const { getFileFunc, getRequireDynamicFile } = require("../utils/get-files");
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

const socket = io("http://localhost:4000");

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
  const configs = getConf(req.uname, res);
  const { init, async, commitIds } = req.body;
  try {
    const { cbObj, lineObj } = await getFileFunc(
      init,
      async,
      commitIds,
      configs
    );
    const output = getRequireDynamicFile("output.js", {});
    const outputOther = getRequireDynamicFile("output-other.js", {});
    res.json({
      code: 200,
      message: "handle-files-success",
      data: output[init],
      data2: outputOther,
      data3: cbObj || {},
      data4: lineObj || {},
    });
  } catch (error) {
    res.json({
      code: 200,
      message: "handle-files-fail",
      data: error?.message || error || "获取数据失败",
    });
  }
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
      data: error || error?.message || "Publish 失败",
    });
  }
});

router.post("/switch-css-ar", authenticateToken, async (req, res) => {
  const { ports, domain } = getConf(req.uname, res);
  const { csscode } = req.body;
  try {
    const converter = new RTLConverter();
    const rtlContent = await converter.convertStyles(csscode);
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
  const { LocalListPro, localPaths } = getConf(req.uname, res);
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
  const { ports, domain } = getConf(req.uname, res);
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
  const { LocalListPro } = getConf(req.uname, res);
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
  const configs = getConf(req.uname, res);
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
  const configs = getConf(req.uname, res);
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
  const { LocalListPro, ports, domain } = getConf(req.uname, res);
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
  const { ports, domain } = getConf(req.uname, res);
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

router.post("/all-pull", authenticateToken, async (req, res) => {
  if (res.app.locals.isW) {
    res.json({
      code: 200,
      message: "pull-error",
      data: "请先关闭 Watching",
    });
    return;
  }
  const { localPaths, ports } = getConf(req.uname, res);
  let { lans } = req.body;
  if (!lans?.length) {
    lans = Object.keys(ports);
  }
  let s = [],
    f = [],
    errorObj = {};
  async function getAllPush() {
    for (let i = 0; i < lans.length; i++) {
      const lan = lans[i];
      try {
        await pullCode({ lan, localPaths });
        s.push(lan);
      } catch (error) {
        f.push(lan);
        errorObj[lan] = error?.message || error;
      }
    }
    return Promise.resolve();
  }

  getAllPush().then(() => {
    let str = "";
    if (s?.length) {
      str += `${s.join(",")} Pull Success, `;
    }
    if (f?.length) {
      str += `${f.join(",")} Pull Fail, ${JSON.stringify(errorObj)}`;
    }
    socket.emit("chat message", {
      type: "all-pull",
      message: str,
    });
  });
  res.json({
    code: 200,
  });

  // try {

  //   const result = await pullCode({ lan, localPaths });
  //   res.json({
  //     code: 200,
  //     message: "pull-success",
  //     data: result,
  //   });
  // } catch (error) {
  //   res.json({
  //     code: 200,
  //     message: "pull-error",
  //     data: error?.message || error,
  //   });
  // }
});

router.post("/check-status", authenticateToken, async (req, res) => {
  const { localPaths } = getConf(req.uname, res);
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
  const { localPaths } = getConf(req.uname, res);
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

router.post("/discard-code", authenticateToken, async (req, res) => {
  const { localPaths } = getConf(req.uname, res);
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
  const { localPaths } = getConf(req.uname, res);
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
  const { localPaths } = getConf(req.uname, res);
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
