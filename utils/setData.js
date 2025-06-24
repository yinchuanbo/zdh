const path = require("path");
const os = require("os");

const getDynamicFilePath = (fileName) => {
  // Use a local directory for data storage
  const userDataPath = path.join(os.homedir(), '.zdh-app');
  const cP = path.join(userDataPath, 'dynamic_files', fileName);
  return cP;
};

const getRequireDynamicFile = (fileName, defaultData = []) => {
  const filePath = getDynamicFilePath(fileName);
  try {
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