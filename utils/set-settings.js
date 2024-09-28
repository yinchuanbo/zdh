const fs = require("fs").promises;
const path = require("path")
const { getDynamicFilePath, getRequireDynamicFile } = require("./setData")

async function setSettings({ data, uname }) {
  const userInfo = getRequireDynamicFile("user-info.js", {})
  if (!userInfo?.[uname]) {
    userInfo[uname] = data;
  } else {
    userInfo[uname] = {
      ...userInfo[uname],
      ...data,
    };
  }
  const jsContent = `module.exports = ${JSON.stringify(userInfo, null, 2)};`;
  const outputPath = getDynamicFilePath('user-info.js');
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, jsContent);
  return Promise.resolve()
}

module.exports = setSettings;
