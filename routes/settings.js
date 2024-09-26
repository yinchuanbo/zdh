var express = require("express");
var router = express.Router();
const userInfo = require("../utils/user-info");
const setSettings = require("../utils/set-settings");
const { authenticateToken } = require("../checkRole");

router.get("/settings", authenticateToken, function (req, res, next) {
  const info = userInfo[req.uname];
  res.render("settings", {
    info,
    keys: Object.keys(info.lans),
  });
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
