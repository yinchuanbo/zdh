const { Worker } = require('worker_threads');
const path = require("path");
const io = require("socket.io-client");

let deployInfo;
let successArr = [];
let errorArr = [];
const socket = io("http://localhost:4000");

async function deployBatch(languages, deployInfoCopy) {
  return new Promise((resolve) => {
    const maxWorkers = Math.min(4, languages.length);
    const workerPool = new Array(maxWorkers).fill().map(() =>
      new Worker(path.join(__dirname, 'deployWorker.js'))
    );

    let currentLanguageIndex = 0;
    let completedWorkers = 0;

    function assignTaskToWorker(worker) {
      if (currentLanguageIndex < languages.length) {
        const [language, url] = languages[currentLanguageIndex];
        const { username, password } = deployInfoCopy;
        worker.postMessage({ language, url, username, password });
        currentLanguageIndex++;
      } else {
        worker.terminate();
        completedWorkers++;
        if (completedWorkers === maxWorkers) {
          resolve();
        }
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
  });
}

async function deployAllLanguages(needLans = [], configs) {
  successArr = [];
  errorArr = [];
  deployInfo = configs.deployInfo;

  const deployInfoCopy = JSON.parse(JSON.stringify(deployInfo));
  const filteredLanguages = Object.entries(deployInfoCopy.languages).filter(
    ([lang]) => needLans.length === 0 || needLans.includes(lang)
  );

  // Process languages in batches of 4
  for (let i = 0; i < filteredLanguages.length; i += 4) {
    const batch = filteredLanguages.slice(i, i + 4);
    await deployBatch(batch, deployInfoCopy);
  }

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
}

module.exports = deployAllLanguages;