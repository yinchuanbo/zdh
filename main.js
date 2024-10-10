const { app, BrowserWindow, session, Menu } = require("electron");
const express = require("./app");
const path = require("path")

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 800,
    icon: path.join(__dirname, 'favicon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      sandbox: true,
      // preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
    }
  });
  // Menu.setApplicationMenu(null);
  // session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  //   callback({
  //     responseHeaders: {
  //       ...details.responseHeaders,
  //       'Content-Security-Policy': [
  //         "default-src 'self'; " +
  //         "script-src 'self' https: http: 'unsafe-inline' 'unsafe-eval'; " +
  //         "style-src 'self' https: http: 'unsafe-inline'; " +
  //         "font-src 'self' https: http: data:; " +
  //         "img-src 'self' https: http: data:; " +
  //         "connect-src 'self' https: http:; " +
  //         "media-src 'self' https: http:;"
  //       ]
  //     }
  //   });
  // });
  // mainWindow.webContents.session.webRequest.onBeforeRequest((details, callback) => {
  //   let resourceUrl;
  //   try {
  //     resourceUrl = new URL(details.url);
  //   } catch (error) {
  //     // 处理无效的 URL
  //     console.error('Invalid URL:', details.url);
  //     callback({ cancel: true });
  //     return;
  //   }

  //   // 处理协议相对 URL
  //   if (details.url.startsWith('//')) {
  //     resourceUrl = new URL(`https:${details.url}`);
  //   }

  //   switch (resourceUrl.protocol) {
  //     case 'https:':
  //     case 'http:':
  //       // 允许加载 HTTP 和 HTTPS 资源
  //       callback({});
  //       break;
  //     case 'file:':
  //       // 允许加载本地文件，但要小心处理
  //       if (resourceUrl.pathname.startsWith(app.getAppPath())) {
  //         callback({});
  //       } else {
  //         console.warn('Blocked access to unauthorized local file:', details.url);
  //         callback({ cancel: true });
  //       }
  //       break;
  //     case 'data:':
  //       // 允许 data URLs（常用于小图片或字体）
  //       callback({});
  //       break;
  //     default:
  //       // 阻止其他协议
  //       console.warn('Blocked request with unauthorized protocol:', details.url);
  //       callback({ cancel: true });
  //   }
  // });

  const port = 4000;

  const expressApp = express();
  const server = require('http').createServer(expressApp);
  const io = require('socket.io')(server);

  io.on('connection', (socket) => {
    console.log('A client connected');
    socket.on('chat message', (msg) => {
      console.log('Message received:', msg);
      io.emit('chat message', msg);
    });
    socket.on('disconnect', () => {
      console.log('A client disconnected');
    });
  });

  server.listen(port, () => {
    console.log(`Express server running on port ${port}`);
    mainWindow.loadURL(`http://localhost:${port}`);
  });

  mainWindow.on("closed", function () {
    mainWindow = null;
  });
}

app.on("ready", createWindow);

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", function () {
  if (mainWindow === null) createWindow();
});
