const { Worker } = require("worker_threads");
const path = require("path");
const os = require("os");
const { sendSSEMessage } = require("../utils/sse")

async function deployBatch(batchOutputs, env, configs) {
  return new Promise((resolve, reject) => {
    const maxWorkers = Math.min(
      os.cpus().length,
      Object.keys(batchOutputs).length
    );
    let completedWorkers = 0;
    const progress = {};

    let timer = null;

    const workerPool = new Array(maxWorkers)
      .fill()
      .map(() => new Worker(path.join(__dirname, "ftpWorker.js")));

    let currentKeyIndex = 0;
    const keys = Object.keys(batchOutputs);

    function updateConsoleProgress() {
      const progressStr = Object.entries(progress)
        .map(([key, value]) => `${key}: ${value}%`)
        .join(" | ");
      sendSSEMessage({ type: "ftp-upload-progress", message: progressStr });
    }

    function assignTaskToWorker(worker) {
      if (currentKeyIndex < keys.length) {
        const key = keys[currentKeyIndex];
        worker.postMessage({ key, values: batchOutputs[key], env, configs });
        currentKeyIndex++;
      } else {
        worker.terminate();
        completedWorkers++;
        if (completedWorkers === maxWorkers) {
          console.log("\nUpload completed!");
          resolve();
        }
      }
    }

    for (const worker of workerPool) {
      worker.on("message", (result) => {
        switch (result.type) {
          case "progress":
            // 显示单个文件的进度
            console.log(
              `${result.key} - ${result.file}: ${result.fileProgress}% (${result.current}/${result.total})`
            );
            break;
          case "totalProgress":
            progress[result.key] = result.progress;
            // 每隔 10s 更新一次进度
            updateConsoleProgress();
            break;
          case "complete":
            if (result.success) {
              completedWorkers++;
              console.log(`\n${result.key} completed!`);
              if (completedWorkers === keys.length) {
                console.log("\nAll uploads completed successfully!");
                resolve();
              } else {
                assignTaskToWorker(worker);
              }
            }
            break;
          case "error":
            console.error(`\nError in ${result.key}:`, result.error);
            reject(
              new Error(`Upload failed for ${result.key}: ${result.error}`)
            );
            break;
        }
      });

      worker.on("error", (error) => {
        console.error(`\nWorker error:`, error);
        reject(error);
      });

      assignTaskToWorker(worker);
    }
  });
}

async function deployToFtp({ lan = "", data = [], env = "test", configs }) {
  const outputs = lan ? { [lan]: data } : data;
  const batchSize = os.cpus().length;

  const keys = Object.keys(outputs);
  for (let i = 0; i < keys.length; i += batchSize) {
    const batchKeys = keys.slice(i, i + batchSize);
    const batchOutputs = {};
    for (const key of batchKeys) {
      batchOutputs[key] = outputs[key];
    }
    await deployBatch(batchOutputs, env, configs);
  }
}

module.exports = deployToFtp;
