const { parentPort } = require("worker_threads");
const { chromium } = require("playwright");

async function waitForDeploymentCompletion(page, timeout) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const failMessage = await page.locator(".blog-login").count();
    const successMessage = await page.locator(".el-message--success").count();

    if (failMessage > 0) {
      return false;
    }
    if (successMessage > 0) {
      return true;
    }
    await page.waitForTimeout(2000);
  }
  return false;
}

async function deployLanguage(language, url, username, password) {
  console.log("is exec");
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

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
    await page
      .locator(".el-button.el-button--primary.is-plain")
      .waitFor({ state: "visible", timeout: 10000 });
    await page.click(".el-button.el-button--primary.is-plain");

    // 等待并点击确认按钮
    await page
      .locator(".el-message-box__btns button")
      .waitFor({ state: "visible", timeout: 10000 });
    await page.click(".el-message-box__btns button");

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
