const { parentPort } = require("worker_threads");
const Client = require("ssh2-sftp-client");
const fs = require("fs");
const crypto = require("crypto");
const { Readable } = require("stream");

parentPort.on("message", async ({ key, values, env, configs }) => {
  let testConn, LocalList, devList;
  if (env === "test") {
    testConn = configs.testConn;
    LocalList = configs.LocalListTest;
    devList = configs.testFoldList;
  } else {
    testConn = configs.proConn;
    LocalList = configs.LocalListPro;
    devList = configs.proFoldList;
  }
  function bufferToStream(buffer) {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
  }
  async function getRemoteFileSize(sftp, remoteFilePath) {
    const remoteFileInfo = await sftp.stat(remoteFilePath);
    return remoteFileInfo.size;
  }
  function fileHash(readStream) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash("sha256");
      readStream.on("data", (chunk) => {
        hash.update(chunk);
      });
      readStream.on("end", () => {
        resolve(hash.digest("hex"));
      });
      readStream.on("error", (err) => {
        reject(err);
      });
    });
  }
  const sftp = new Client();
  let imgHasPath = [];
  try {
    console.log('尝试链接')
    await sftp.connect(testConn);
    for (let i = 0; i < values.length; i++) {
      const dir = values[i];
      let localFilePath = `${LocalList[key]}${dir.replace(/\//g, "\\")}`;
      let remoteFilePath = `${devList[key]}${dir}`;
      const lastIndex = remoteFilePath.lastIndexOf("/");
      const prefix = remoteFilePath.substring(0, lastIndex);

      if (!imgHasPath.includes(prefix)) {
        const exists = await sftp.exists(prefix);
        if (!exists) {
          await sftp.mkdir(prefix, true);
        }
        imgHasPath.push(prefix);
      }

      await sftp.fastPut(localFilePath, remoteFilePath);
      const remoteFileSize = await getRemoteFileSize(sftp, remoteFilePath);
      const localFileSize = fs.statSync(localFilePath).size;

      if (remoteFileSize !== localFileSize) {
        throw new Error(
          `File upload successful, but sizes don't match - ${localFilePath}`
        );
      }

      if (
        localFilePath.endsWith(".js") ||
        localFilePath.endsWith(".css") ||
        localFilePath.endsWith(".scss") ||
        localFilePath.endsWith(".tpl") ||
        localFilePath.endsWith(".html") ||
        localFilePath.endsWith(".json")
      ) {
        const localFileSizeStream = fs.createReadStream(localFilePath);
        const remoteStream = await sftp.get(remoteFilePath);
        const hash1 = await fileHash(localFileSizeStream);
        const hash2 = await fileHash(bufferToStream(remoteStream));
        if (hash1 !== hash2) {
          throw new Error(
            `File upload successful, but contents don't match - ${localFilePath}`
          );
        }
      }
    }

    await sftp.end();
    parentPort.postMessage({ success: true, key });
  } catch (error) {
    await sftp.end();
    parentPort.postMessage({ success: false, key, error: error.message });
  }
});
