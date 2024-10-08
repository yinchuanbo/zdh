var express = require("express");
const getConf = require("../utils/conf");
var deployAllLanguages = require("../utils/deploy-website");
const { authenticateToken } = require("../permissions");
var router = express.Router();

router.get("/", authenticateToken, function (req, res, next) {
  const { lans } = getConf(req.uname, res);
  res.render("deploy", { title: "Deploy", lans: Object.keys(lans) });
});

router.post("/deploy-one", authenticateToken, async function (req, res, next) {
  const configs = getConf(req.uname, res);
  const { lan } = req.body;
  deployAllLanguages(lan, configs);
  res.json({
    code: 200,
    message: "deploy-processing",
  });
});

module.exports = router;
