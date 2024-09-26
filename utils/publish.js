const https = require("https");
const axios = require("axios");

function handlePublish(lan = "en", ports, domain) {
  return new Promise((resolve, reject) => {
    const url = `https://${domain}:${ports[lan]}/admin/preview/publish`;
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });
    axios
      .get(url, {
        httpsAgent: agent,
      })
      .then((res) => {
        if (res.data.code == 200) {
          resolve();
        } else {
          reject();
        }
      })
      .catch(() => {
        reject();
      });
  });
}

module.exports = handlePublish;
