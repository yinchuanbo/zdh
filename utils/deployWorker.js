const { parentPort } = require("worker_threads");
const puppeteer = require("puppeteer");

async function waitForDeploymentCompletion(page, timeout) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const content = await page.content();
    if (content.includes("blog-login")) {
      return false;
    }
    if (content.includes("更新完成")) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  return false;
}

async function deployLanguage(language, url, username, password) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    ignoreDefaultArgs: ["--enable-automation"],
  });

  let page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: "networkidle0" });
    await page.type(".el-input__inner[type='text']", username);
    await page.type(".el-input__inner[type='password']", password);

    await Promise.all([
      page.click(".el-button.el-button--primary.mt-15"),
      page.waitForNavigation({ waitUntil: "networkidle0" }),
    ]);

    await page.waitForSelector(".el-button.el-button--primary.is-plain", {
      visible: true,
      timeout: 10000,
    });
    await page.click(".el-button.el-button--primary.is-plain");

    await page.waitForSelector(".el-message-box__btns button", {
      visible: true,
      timeout: 10000,
    });
    await page.click(".el-message-box__btns button");

    const res = await waitForDeploymentCompletion(page, 5 * 60 * 1000);
    if (res) {
      parentPort.postMessage({ success: true, language });
    } else {
      throw new Error("Deployment timed out or logged out");
    }
  } catch (error) {
    parentPort.postMessage({ success: false, language, error: error.message });
  } finally {
    await page.close();
    await browser.close();
  }
}

parentPort.on("message", (message) => {
  const { language, url, username, password } = message;
  deployLanguage(language, url, username, password);
});
