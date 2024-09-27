var express = require("express");
const fs = require("fs");
var router = express.Router();

var { bcrypt, jwt, JWT_SECRET } = require("../permissions");

router.get("/login", function (req, res, next) {
  res.render("login");
});

router.post("/login", async (req, res) => {
  delete require.cache[require.resolve("../account")];
  let accounts = require("../account");
  const { username, password } = req.body;
  const user = accounts.find((u) => u.username === username);
  // const newP = await bcrypt.hash(password, 10);
  if (user && (await bcrypt.compare(password, user.password))) {
    const token = jwt.sign(
      { id: user.id, role: user.role, uname: user.username },
      JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 60 * 60 * 1000,
    });
    res.json({ code: 200, token });
  } else {
    res.status(401).json({ code: 401, message: "认证失败" });
  }
});

router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  delete require.cache[require.resolve("../account")];
  let accounts = require("../account");
  const has = accounts.find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );
  if (has) {
    res.json({ code: 400, message: "用户名已存在" });
    return;
  }
  const data = {
    id: accounts?.length + 1,
    username: username,
    password: await bcrypt.hash(password, 10),
    orginP: password,
    role: "user",
  };
  accounts = [...accounts, data];

  const jsContent = `module.exports = ${JSON.stringify(accounts, null, 2)};`;
  fs.writeFileSync("./account.js", jsContent);
  res.json({ code: 200, message: "注册成功" });
});

router.get("/log-out", function (req, res, next) {
  res.clearCookie("token");
  res.json({ code: 200, message: "退出成功" });
});

module.exports = router;
