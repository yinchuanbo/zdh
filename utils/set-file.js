const fs = require("fs");

function setFile({ path, content }) {
  try {
    fs.writeFileSync(path, content, "utf-8");
    return Promise.resolve();
  } catch (err) {
    console.log("err", err);
    return Promise.reject();
  }
}

module.exports = {
  setFile,
};
