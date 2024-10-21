const { app } = require('electron');
const path = require("path");

const getDynamicFilePath = (fileName) => {
  const cP = path.join(app.getPath('userData'), 'dynamic_files', fileName);
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