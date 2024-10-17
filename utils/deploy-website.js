const { Worker } = require('worker_threads');
const path = require("path");
const io = require("socket.io-client");
const os = require('os');

let deployInfo;
let successArr = [];
let errorArr = [];
const socket = io("http://localhost:4000");

function deployAllLanguages(needLans = [], configs) {
  return new Promise(async (resolve) => {
    successArr = [];
    errorArr = [];
    deployInfo = configs.deployInfo;

    const deployInfoCopy = JSON.parse(JSON.stringify(deployInfo));
    const filteredLanguages = Object.entries(deployInfoCopy.languages).filter(
      ([lang]) => needLans.length === 0 || needLans.includes(lang)
    );

    const cpuCount = os.cpus().length;
    const workerCount = Math.min(cpuCount, filteredLanguages.length);

    const workerPool = new Array(workerCount).fill().map(() =>
      new Worker(path.join(__dirname, 'deployWorker.js'))
    );

    let currentLanguageIndex = 0;

    function assignTaskToWorker(worker) {
      if (currentLanguageIndex < filteredLanguages.length) {
        const [language, url] = filteredLanguages[currentLanguageIndex];
        const { username, password } = deployInfoCopy;
        worker.postMessage({ language, url, username, password });
        currentLanguageIndex++;
      } else {
        worker.terminate();
      }
    }

    for (const worker of workerPool) {
      worker.on('message', (result) => {
        if (result.success) {
          successArr.push(result.language);
        } else {
          errorArr.push(result.language);
        }
        assignTaskToWorker(worker);
      });
      worker.on('error', (error) => {
        console.error(`Error in worker:`, error);
        errorArr.push(error.language);
        assignTaskToWorker(worker);
      });

      assignTaskToWorker(worker);
    }

    // Wait for all workers to finish
    await Promise.all(workerPool.map(worker =>
      new Promise(resolve => worker.on('exit', resolve))
    ));

    let str = "";
    if (successArr.length) {
      str += `${successArr.join(",")} 部署成功，`;
    }
    if (errorArr.length) {
      str += `${errorArr.join(",")} 部署失败。`;
    }

    console.log('str', str);
    socket.emit("chat message", {
      type: "deploy-result",
      message: str,
    });

    resolve();
  });
}

module.exports = deployAllLanguages;