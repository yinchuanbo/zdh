var express = require("express");
var router = express.Router();
const setSettings = require("../utils/set-settings");
const { authenticateToken } = require("../permissions");

router.get("/settings", authenticateToken, function (req, res, next) {
  delete require.cache[require.resolve("../utils/user-info")];
  let userInfo = require("../utils/user-info");
  const info = userInfo[req.uname];
  const params = {};
  if (info && info?.lans) {
    params.info = info;
    params.keys = Object.keys(info.lans);
  } else {
    params.info = {
      pathname: "",
      domain: "",
    };
    params.keys = [];
  }
  res.render("settings", params);
});

router.post("/settings", authenticateToken, async function (req, res, next) {
  const { data } = req.body;

  try {
    setSettings({ data, uname: req.uname });
    res.json({
      code: 200,
      message: "settings-success",
    });
  } catch (error) {
    res.json({
      code: 200,
      message: "settings-fail",
    });
  }
});

module.exports = router;
