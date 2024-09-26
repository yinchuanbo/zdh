const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const users = [
  // aWGTlyxuqe
  {
    id: 1,
    username: "admin",
    password: "$2b$10$Fn0QWF/ZDGlWy0QF2sYo/O0tMqFbLBweZcMV2VNhXnSgVwxpWLRu.",
    role: "admin",
  },
  // 6aIIgmXsb8
  {
    id: 2,
    username: "user",
    password: "$2b$10$rNlXX/eY5rAdRPi10MJpZensZNNFIHq0pE6zomImxPJzU8KxPZ3Qe",
    role: "user",
  },
];

const JWT_SECRET = "agfygsfyuedasdfsf65465YUGYUFwegweySWMFSG";

function authenticateToken(req, res, next) {
  const token = req.cookies.token;
  if (token == null) return res.redirect("/login");
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.redirect("/login");
    req.user = user;
    req.role = user.role;
    req.uname = user.uname;
    console.log('user', user)
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
  users,
  bcrypt,
  jwt,
  JWT_SECRET,
};
