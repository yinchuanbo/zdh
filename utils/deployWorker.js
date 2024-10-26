const { parentPort } = require("worker_threads");
const puppeteer = require("puppeteer");

async function waitForDeploymentCompletion(page, timeout) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const failMessage = await page.$(".blog-login");
    const successMessage = await page.$(".el-message--success");
    if (failMessage) {
      return false;
    }
    if (successMessage) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  return false;
}

async function deployLanguage(language, url, username, password) {
  console.log("is exec")
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
    const res = await waitForDeploymentCompletion(page, 4 * 60 * 1000);
    if (res) {
      parentPort.postMessage({ success: true, language });
    } else {
      console.log('--------fail', res)
      throw new Error("Deployment timed out or logged out");
    }
  } catch (error) {
    console.log('--------fail2', error)
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
