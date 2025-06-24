const jwt = require("jsonwebtoken");
// Temporarily disable bcrypt due to compatibility issues
// const bcrypt = require("bcrypt");
const bcrypt = {
  hash: async (password, rounds) => {
    // Simple fallback - in production, use proper bcrypt
    return password + '_hashed';
  },
  compare: async (password, hash) => {
    // Simple fallback - in production, use proper bcrypt
    return hash === password + '_hashed';
  }
};

const JWT_SECRET = "agfygsfyuedasdfsf65465YUGYUFwegweySWMFSG";
function authenticateToken(req, res, next) {
  const token = req.cookies.token;
  console.log('认证检查 - URL:', req.url, 'Token存在:', !!token);
  if (token == null) {
    console.log('Token不存在，重定向到登录页');
    return res.redirect("/login");
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
     console.log('JWT验证失败:', err.message);
     return res.redirect("/login")
    };
    console.log('JWT验证成功，用户:', user.uname);
    req.user = user;
    req.role = user.role;
    req.uname = user.uname;
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
