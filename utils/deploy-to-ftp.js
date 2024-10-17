const { Worker } = require('worker_threads');
const os = require('os');
const path = require('path');

async function deployToFtp({ lan = "", data = [], env = "test", configs }) {
  const outputs = {
    [lan]: data,
  };

  const cpuCount = os.cpus().length;
  const workerCount = Math.min(cpuCount, Object.keys(outputs).length);

  return new Promise((resolve, reject) => {
    let completedWorkers = 0;
    let errorOccurred = false;

    const workerPool = new Array(workerCount).fill().map(() =>
      new Worker(path.join(__dirname, 'ftpWorker.js'))
    );

    let currentKeyIndex = 0;
    const keys = Object.keys(outputs);

    function assignTaskToWorker(worker) {
      if (currentKeyIndex < keys.length) {
        const key = keys[currentKeyIndex];
        worker.postMessage({ key, values: outputs[key], env, configs });
        currentKeyIndex++;
      } else {
        worker.terminate();
      }
    }

    for (const worker of workerPool) {
      worker.on('message', (result) => {
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

      worker.on('error', (error) => {
        errorOccurred = true;
        console.error(`Worker error:`, error);
        reject(error);
      });

      assignTaskToWorker(worker);
    }
  });
}

module.exports = deployToFtp;