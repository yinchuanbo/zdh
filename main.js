const { app, BrowserWindow } = require("electron");
const path = require("path");
const express = require("./app");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  const port = 3000;
  express.listen(port, () => {
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
