const fs = require("fs");
const userInfo = require("./user-info");
function setSettings({ data, uname }) {
  if (!userInfo[uname]) {
    userInfo[uname] = data;
  } else {
    userInfo[uname] = {
      ...userInfo[uname],
      ...data,
    };
  }
  const jsContent = `module.exports = ${JSON.stringify(userInfo, null, 2)};`;
  fs.writeFileSync("./utils/user-info.js", jsContent);
}

module.exports = setSettings;
