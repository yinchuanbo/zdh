
var express = require("express");
const { supabaseInsert, getUserName, getAllUsers } = require("../utils/supabase")
var router = express.Router();

var { bcrypt, jwt, JWT_SECRET } = require("../permissions");


router.get("/login", function (req, res, next) {
  res.render("login");
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  let accounts = await getAllUsers();
  const user = accounts.find((u) => u.username === username && u.orginP === password);
  if (user && (await bcrypt.compare(password, user.password))) {
    const token = jwt.sign(
      { id: user.id, role: user.role, uname: user.username },
      JWT_SECRET,
      {
        expiresIn: "1y",
      }
    );
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1年，与JWT过期时间一致
      secure: false, // 开发环境设为false
      // 不设置sameSite和domain，让浏览器使用默认值
    });
    res.json({ code: 200, token });
  } else {
    res.status(401).json({ code: 401, message: "认证失败" });
  }
});

router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const data = {
    username: username,
    password: await bcrypt.hash(password, 10),
    orginP: password,
    role: "user",
  };
  try {
    const getUserNameRes = await getUserName();
    if (getUserNameRes?.length) {
      const findUName = getUserNameRes.find(item => (item?.username || '').toLowerCase().trim() === (username || '').toLowerCase().trim());
      if (findUName) {
        res.json({ code: 400, message: "用户名已存在" });
        return;
      }
    }
    await supabaseInsert(data)
    return res.json({ code: 200, message: "注册成功" });
  } catch (error) {
    return res.json({ code: 400, message: error || error?.message });
  }
});

router.get("/log-out", function (req, res, next) {
  res.clearCookie("token");
  res.json({ code: 200, message: "退出成功" });
});

module.exports = router;
