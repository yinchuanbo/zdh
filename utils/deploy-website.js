const puppeteer = require("puppeteer");
const io = require("socket.io-client");
let deployInfo;
let successArr = [],
  errorArr = [];

const socket = io("http://localhost:3000");

async function waitForDeploymentCompletion(page, timeout) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const content = await page.content();
    if (content.includes("更新完成")) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

async function deployLanguage(language, url, username, password) {
  const browser = await puppeteer.launch({ headless: true });
  let pages = await browser.pages();
  let page = pages[0];
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
      return { success: true, language };
    } else {
      throw new Error("Deployment timed out");
    }
  } catch (error) {
    return { success: false, language, error: error.message };
  } finally {
    await browser.close();
  }
}

function deployAllLanguages(needLans = [], configs) {
  return new Promise(async (resolve, reject) => {
    successArr = [];
    deployInfo = configs.deployInfo;
    console.log('这里2')
    const deployInfoCopy = JSON.parse(JSON.stringify(deployInfo));
    const filteredLanguages = Object.entries(deployInfoCopy.languages).filter(
      ([lang]) => needLans.length === 0 || needLans.includes(lang)
    );
    for (let i = 0; i < filteredLanguages.length; i++) {
      const element = filteredLanguages[i];
      const [language, url] = element;
      const username = deployInfoCopy.username;
      const password = deployInfoCopy.password;
      try {
        await deployLanguage(language, url, username, password);
        successArr.push(language);
      } catch (err) {
        errorArr.push(language);
        continue;
      }
    }
    let str = "";
    if (successArr.length) {
      str += `${successArr.join(",")} 部署成功，`;
    }
    if (errorArr.length) {
      str += `${errorArr.join(",")} 部署失败。`;
    }
    console.log('str', str)
    socket.emit("chat message", {
      type: "deploy-result",
      message: str,
    });
  });
}

module.exports = deployAllLanguages;
