const express = require('express');
const cors = require("cors");
const createError = require("http-errors");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const deployRouter = require("./routes/deploy");
const ftpRouter = require("./routes/ftp");
const loginRouter = require("./routes/login");
const settingsRouter = require("./routes/settings");

function createApp() {
  const app = express();

  // 视图引擎设置
  app.set("views", path.join(__dirname, "views"));
  app.set("view engine", "ejs");

  // 中间件
  app.use(logger("dev"));
  app.use(cors({
    origin: "*", // 根据需要设置允许的域名
  }));
  app.use(express.json({ limit: "100mb" }));
  app.use(express.urlencoded({ extended: true, limit: "100mb" }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, "public")));

  // 路由
  app.use("/", indexRouter);
  app.use("/", loginRouter);
  app.use("/", settingsRouter);
  app.use("/users", usersRouter);
  app.use("/deploy", deployRouter);
  app.use("/ftp", ftpRouter);

  // 捕获 404 并转发到错误处理程序
  app.use(function (req, res, next) {
    next(createError(404));
  });

  // 错误处理
  app.use(function (err, req, res, next) {
    // 设置局部变量，仅在开发中提供错误
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // 渲染错误页面
    res.status(err.status || 500);
    res.render("error");
  });

  return app;
}

module.exports = createApp;