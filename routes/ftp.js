var express = require("express");
const getConf = require("../utils/conf");
const { getAllFiles, handleFtp } = require("../utils/handle-ftp");
const { authenticateToken } = require("../permissions");
const { sendSSEMessage } = require("../utils/sse");
var router = express.Router();

router.get("/", authenticateToken, async function (req, res, next) {
  const { lans } = await getConf(req.uname, res, req.user.id);
  res.render("ftp", { title: "Ftp", lans: Object.keys(lans) });
});

router.post("/get-files", authenticateToken, async function (req, res, next) {
  const configs = await getConf(req.uname, res, req.user.id);
  const { env, data } = req.body;
  try {
    const result = await getAllFiles({
      env,
      data,
      configs,
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
  const configs = await getConf(req.uname, res, req.user.id);
  const { env, data } = req.body;
  try {
    handleFtp({ env, data, configs })
      .then(() => {
        sendSSEMessage({
          type: "upload-ftp-success",
          message: `${env === "test" ? "测试服" : "正式服"} FTP 上传成功`,
        });
      })
      .catch((error) => {
        sendSSEMessage({
          type: "upload-ftp-fail",
          message: error?.message || error || "未知错误",
        })
      });
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
