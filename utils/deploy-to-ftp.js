const { Worker } = require("worker_threads");
const fs = require("fs");
const path = require("path");

async function deployBatch(batchOutputs, env, configs) {
  return new Promise((resolve, reject) => {
    const maxWorkers = Math.min(4, Object.keys(batchOutputs).length);
    let completedWorkers = 0;
    const workerPool = new Array(maxWorkers)
      .fill()
      .map(() => new Worker(path.join(__dirname, "ftpWorker.js")));
    let currentKeyIndex = 0;
    const keys = Object.keys(batchOutputs);
    function assignTaskToWorker(worker) {
      if (currentKeyIndex < keys.length) {
        const key = keys[currentKeyIndex];
        worker.postMessage({ key, values: batchOutputs[key], env, configs });
        currentKeyIndex++;
      } else {
        worker.terminate();
        completedWorkers++;
        if (completedWorkers === maxWorkers) {
          resolve();
        }
      }
    }
    for (const worker of workerPool) {
      worker.on("message", (result) => {
        if (result.success) {
          completedWorkers++;
          if (completedWorkers === keys.length) {
            resolve();
          } else {
            assignTaskToWorker(worker);
          }
        } else {
          errorOccurred = true;
          reject(new Error(`Error in worker for language ${result.key}`));
        }
      });
      worker.on("error", (error) => {
        errorOccurred = true;
        console.error(`Worker error:`, error);
        reject(error);
      });
      assignTaskToWorker(worker);
    }
  });
}

async function deployToFtp({ lan = "", data = [], env = "test", configs }) {
  let outputs = data;
  if (lan) {
    outputs = {
      [lan]: data,
    };
  }
  // if (env === "test") {
  //   for (const key in outputs) {
  //     const val = outputs[key];
  //     const find = val.find((item) => {
  //       const p = `${configs.LocalListTest[lan]}${item}`.replaceAll("\\", "/");
  //       return !fs.existsSync(p);
  //     });
  //     console.log("sdfdsfdsf");
  //     if (find) {
  //       throw new Error(`${find} 文件不存在`);
  //     }
  //   }
  // }
  const batchSize = 4;
  const keys = Object.keys(outputs);
  for (let i = 0; i < keys.length; i += batchSize) {
    const batchKeys = keys.slice(i, i + batchSize);
    const batchOutputs = {};
    for (const key of batchKeys) {
      batchOutputs[key] = outputs[key];
    }
    try {
      await deployBatch(batchOutputs, env, configs);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = deployToFtp;
