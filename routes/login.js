var express = require("express");
var router = express.Router();
var { users, bcrypt, jwt, JWT_SECRET } = require("../checkRole");

router.get("/login", function (req, res, next) {
  res.render("Login");
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = users.find((u) => u.username === username);
  // const newP = await bcrypt.hash(password, 10);
  if (user && (await bcrypt.compare(password, user.password))) {
    const token = jwt.sign(
      { id: user.id, role: user.role, uname: user.username },
      JWT_SECRET,
      {
        expiresIn: "1h",
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

module.exports = router;
