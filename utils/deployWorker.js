const { parentPort } = require("worker_threads");
const path = require("path");
const fs = require("fs");

// 在引入 playwright 之前配置浏览器路径
// 优先检查 exe 同级目录下的 playwright-browsers 文件夹
const isPkg = typeof process.pkg !== "undefined";
if (isPkg) {
  const exeDir = path.dirname(process.execPath);
  const localBrowsersPath = path.join(exeDir, "playwright-browsers");
  if (fs.existsSync(localBrowsersPath)) {
    console.log(`[DeployWorker] Using local browsers from: ${localBrowsersPath}`);
    process.env.PLAYWRIGHT_BROWSERS_PATH = localBrowsersPath;
  }
}

const { chromium } = require("playwright");

async function waitForDeploymentCompletion(page, timeout) {
  try {
    const result = await page.waitForFunction(
      () => {
        const fail = document.querySelectorAll(".blog-login").length > 0;
        const success = document.querySelectorAll(".el-message--success").length > 0;
        if (fail) return "fail";
        if (success) return "success";
        return null;
      },
      null,
      { timeout, polling: 2000 }
    );
    const value = await result.jsonValue();
    return value === "success";
  } catch (error) {
    return false;
  }
}

async function deployLanguage(language, url, username, password) {
  console.log("is exec");
  
  // 尝试使用本机浏览器，减少打包体积
  let launchOptions = {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  };

  // 辅助函数：查找浏览器路径
  const findBrowserPath = () => {
    const commonPaths = [
      // Edge Paths
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
      path.join(process.env.LOCALAPPDATA || "", "Microsoft\\Edge\\Application\\msedge.exe"),
      // Chrome Paths
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      path.join(process.env.LOCALAPPDATA || "", "Google\\Chrome\\Application\\chrome.exe"),
    ];
    
    for (const p of commonPaths) {
      if (fs.existsSync(p)) return { path: p, channel: p.toLowerCase().includes('edge') ? 'msedge' : 'chrome' };
    }
    return null;
  };

  // 1. 优先尝试显式查找本机浏览器 (最稳健的方式)
  const localBrowser = findBrowserPath();
  if (localBrowser) {
     console.log(`[DeployWorker] Found local browser at: ${localBrowser.path}`);
     launchOptions.executablePath = localBrowser.path;
  } else {
     // 2. 没找到，尝试让 Playwright 自动查找 (可能失败)
     console.log("[DeployWorker] Local browser not found in common paths, trying auto-detect...");
     launchOptions.channel = 'msedge'; 
  }

  let browser;
  try {
    browser = await chromium.launch(launchOptions);
  } catch (err1) {
    console.log("Failed to launch first attempt:", err1.message);
    
    // 3. 失败重试：尝试 Chrome channel
    try {
      console.log("Retrying with Chrome channel...");
      delete launchOptions.executablePath;
      launchOptions.channel = 'chrome';
      browser = await chromium.launch(launchOptions);
    } catch (err2) {
      console.log("Failed to launch Chrome channel:", err2.message);
      
      // 4. 最终兜底：尝试自带浏览器 (bundled)
      try {
        console.log("Falling back to bundled browser...");
        delete launchOptions.channel;
        delete launchOptions.executablePath;
        browser = await chromium.launch(launchOptions);
      } catch (err3) {
        console.error("FATAL: All browser launch attempts failed.");
        parentPort.postMessage({ 
          success: false, 
          language, 
          error: "无法启动浏览器。请确保安装了 Edge/Chrome，或将 playwright-browsers 文件夹放在程序同级目录下。" 
        });
        return;
      }
    }
  }

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: "networkidle" });

    // 填写登录表单
    await page.fill(".el-input__inner[type='text']", username);
    await page.fill(".el-input__inner[type='password']", password);

    // 点击登录并等待导航
    await Promise.all([
      page.click(".el-button.el-button--primary.mt-15"),
      page.waitForLoadState("networkidle"),
    ]);

    // 等待并点击部署按钮
    await page.click(".el-button.el-button--primary.is-plain", { timeout: 10000 });

    // 等待并点击确认按钮
    await page.click(".el-message-box__btns button", { timeout: 10000 });

    // 等待部署完成
    const res = await waitForDeploymentCompletion(page, 4 * 60 * 1000);

    if (res) {
      parentPort.postMessage({ success: true, language });
    } else {
      console.log("--------fail", res);
      throw new Error("Deployment timed out or logged out");
    }
  } catch (error) {
    console.log("--------fail2", error);
    parentPort.postMessage({ success: false, language, error: error.message });
  } finally {
    await context.close();
    await browser.close();
  }
}

parentPort.on("message", (message) => {
  const { language, url, username, password } = message;
  deployLanguage(language, url, username, password);
});
