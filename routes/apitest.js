var express = require("express");
var router = express.Router();
const { authenticateToken } = require("../permissions");

router.get("/api-test", authenticateToken, function (req, res, next) {
  res.render("api-test");
});

module.exports = router;
