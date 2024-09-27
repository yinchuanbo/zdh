const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const JWT_SECRET = "agfygsfyuedasdfsf65465YUGYUFwegweySWMFSG";
function authenticateToken(req, res, next) {
  const token = req.cookies.token;
  if (token == null) return res.redirect("/login");
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.redirect("/login");
    req.user = user;
    req.role = user.role;
    req.uname = user.uname;
    console.log("user", user);
    next();
  });
}

function checkRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ message: "没有权限访问此资源" });
    }
    next();
  };
}
module.exports = {
  authenticateToken,
  checkRole,
  bcrypt,
  jwt,
  JWT_SECRET,
};
