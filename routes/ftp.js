var express = require("express");
const getConf = require("../utils/conf");
const { getAllFiles, handleFtp } = require("../utils/handle-ftp");
const { authenticateToken } = require("../permissions");
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
  try {
    await handleFtp({ env, data, configs });
    res.json({
      code: 200,
      message: "ftp-upload-success",
    });
  } catch (error) {
    console.log('error', error)
    res.json({
      code: 200,
      message: "ftp-upload-fail",
    });
  }
});

module.exports = router;
