var express = require("express");
var router = express.Router();
const setSettings = require("../utils/set-settings");
const { authenticateToken } = require("../permissions");
const { getAllSettingsByUserId } = require("../utils/supabase")

router.get("/settings", authenticateToken, async function (req, res, next) {
  let findData = await getAllSettingsByUserId(req.user.id)
  if (findData) {
    findData = JSON.parse(findData)
  }

  const info = findData;
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
    await setSettings({ data, req });
    res.json({
      code: 200,
      message: "settings-success",
    });
  } catch (error) {
    console.log('setting error ', error)
    res.json({
      code: 200,
      message: "settings-fail",
    });
  }
});

module.exports = router;
