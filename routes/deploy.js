var express = require("express");
const getConf = require("../utils/conf");
var deployAllLanguages = require("../utils/deploy-website");
const { authenticateToken } = require("../permissions");
var router = express.Router();

router.get("/", authenticateToken, async function (req, res, next) {
  const { lans } = await getConf(req.uname, res, req.user.id);
  res.render("deploy", { title: "Deploy", lans: Object.keys(lans) });
});

router.post("/deploy-one", authenticateToken, async function (req, res, next) {
  const configs = await getConf(req.uname, res, req.user.id);
  const { lan } = req.body;
  deployAllLanguages(lan, configs);
  res.json({
    code: 200,
    message: "deploy-processing",
  });
});

module.exports = router;
