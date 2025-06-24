const express = require("express");
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
const coderestorationRouter = require("./routes/code-restoration");

function createApp() {
  const app = express();

  app.locals.isW = false;

  // 视图引擎设置
  app.set("views", path.join(__dirname, "views"));
  app.set("view engine", "ejs");

  // 中间件
  // 在生产环境中使用更简洁的日志格式
  app.use(logger(app.get("env") === "production" ? "combined" : "dev"));

  app.use(
    cors({
      origin: true, // 允许所有来源
      credentials: true, // 允许发送cookies
    })
  );

  // 为大型请求设置合理的限制
  app.use(express.json({ limit: "50mb" })); // 减小了限制，但仍然足够大
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));
  app.use(cookieParser());

  // 为静态资源添加缓存控制
  app.use(
    express.static(path.join(__dirname, "public"), {
      maxAge: app.get("env") === "production" ? "1d" : 0, // 生产环境缓存1天
    })
  );

  // 路由
  app.use("/", indexRouter);
  app.use("/", loginRouter);
  app.use("/", settingsRouter);
  app.use("/code-restoration", coderestorationRouter);
  app.use("/users", usersRouter);
  app.use("/deploy", deployRouter);
  app.use("/ftp", ftpRouter);

  // 添加简单的性能监控
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (duration > 500) {
        console.warn(`Slow request: ${req.method} ${req.url} - ${duration}ms`);
      }
    });
    next();
  });

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
