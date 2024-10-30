var express = require("express");
const getConf = require("../utils/conf");
const { getAllFiles, handleFtp } = require("../utils/handle-ftp");
const { authenticateToken } = require("../permissions");
const io = require("socket.io-client");
var router = express.Router();

router.get("/", authenticateToken, function (req, res, next) {
  const { lans } = getConf(req.uname, res);
  res.render("ftp", { title: "Ftp", lans: Object.keys(lans) });
});

router.post("/get-files", authenticateToken, async function (req, res, next) {
  const configs = getConf(req.uname, res);
  const { env, data } = req.body;
  try {
    const result = await getAllFiles({
      env,
      data,
      configs
    });
    res.json({
      code: 200,
      message: "ftp-success",
      data: JSON.stringify(result, null, 2),
    });
  } catch (error) {
    res.json({
      code: 200,
      message: "ftp-fail",
    });
  }
});

router.post("/upload-ftp", authenticateToken, async function (req, res, next) {
  const configs = getConf(req.uname, res);
  const { env, data } = req.body;
  const socket = io("http://localhost:4000");
  try {
    handleFtp({ env, data, configs }).then(() => {
      socket.emit("chat message", {
        type: "upload-ftp-success",
        message: `${env === 'test' ? '测试服':'正式服'} FTP 上传成功`,
      });
    }).catch((error) => {
      socket.emit("chat message", {
        type: "upload-ftp-fail",
        message: error?.message || error || "未知错误",
      });
    })
    res.json({
      code: 200,
      message: "ftp-upload-success",
    });
  } catch (error) {
    res.json({
      code: 200,
      message: "ftp-upload-fail",
    });
  }
});

module.exports = router;
