const path = require("path");
const os = require("os");
const fs = require("fs");

const getDynamicFilePath = (fileName) => {
  // Use a local directory for data storage
  const userDataPath = path.join(os.homedir(), '.zdh-app');
  // 确保目录存在
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  const dynamicFilesPath = path.join(userDataPath, 'dynamic_files');
  if (!fs.existsSync(dynamicFilesPath)) {
    fs.mkdirSync(dynamicFilesPath, { recursive: true });
  }
  const cP = path.join(dynamicFilesPath, fileName);
  return cP;
};

const getRequireDynamicFile = (fileName, defaultData = []) => {
  const filePath = getDynamicFilePath(fileName);
  try {
    // 检查文件是否存在，不存在则创建默认文件
    if (!fs.existsSync(filePath)) {
      const jsContent = `module.exports = ${JSON.stringify(defaultData, null, 2)};`;
      fs.writeFileSync(filePath, jsContent, 'utf8');
    }
    delete require.cache[filePath];
    return require(filePath);
  } catch (error) {
    return defaultData;
  }
};

module.exports = {
  getDynamicFilePath,
  getRequireDynamicFile
}