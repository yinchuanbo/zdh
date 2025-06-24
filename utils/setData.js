const path = require("path");
const os = require("os");
const fs = require("fs");

const getDynamicFilePath = (fileName) => {
  // Use a local directory for data storage
  const userDataPath = path.join(os.homedir(), '.zdh-app');
  const cP = path.join(userDataPath, 'dynamic_files', fileName);
  return cP;
};

const getRequireDynamicFile = (fileName, defaultData = []) => {
  const filePath = getDynamicFilePath(fileName);
  try {
    // 检查是否在 pkg 环境中运行
    if (process.pkg) {
      // 在打包环境中，使用 fs 读取文件内容并 eval
      const fs = require('fs');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        // 创建一个模块对象来执行代码
        const module = { exports: {} };
        const exports = module.exports;
        eval(content);
        return module.exports;
      }
      return defaultData;
    } else {
      // 在开发环境中使用正常的 require
      delete require.cache[filePath];
      return require(filePath);
    }
  } catch (error) {
    return defaultData;
  }
};

module.exports = {
  getDynamicFilePath,
  getRequireDynamicFile
}