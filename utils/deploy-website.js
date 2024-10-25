const { Worker } = require('worker_threads');
const path = require("path");
const io = require("socket.io-client");

let deployInfo;
let successArr = [];
let errorArr = [];
let inProgress = 0;
const socket = io("http://localhost:4000");

function sendProgressUpdate(total) {
  socket.emit("chat message", {
    type: "deploy-progress",
    message: `部署进度: ${successArr.length + errorArr.length}/${total}，成功: ${successArr.length}，失败: ${errorArr.length}`,
  });
}

function updateProgress(total) {
  inProgress--;
  sendProgressUpdate(total);
}

async function deployBatch(languages, deployInfoCopy, totalLanguages) {
  return new Promise((resolve) => {
    const maxWorkers = Math.min(4, languages.length);
    const workerPool = new Array(maxWorkers).fill().map(() =>
      new Worker(path.join(__dirname, 'deployWorker.js'))
    );

    let currentLanguageIndex = 0;
    let completedWorkers = 0;

    function assignTaskToWorker(worker) {
      if (currentLanguageIndex < languages.length) {
        inProgress++;
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
        updateProgress(totalLanguages);
        assignTaskToWorker(worker);
      });
      worker.on('error', (error) => {
        console.error(`Error in worker:`, error);
        errorArr.push("Unknown language due to error.");
        updateProgress(totalLanguages);
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
  const totalLanguages = filteredLanguages.length;

  const progressInterval = setInterval(() => sendProgressUpdate(totalLanguages), 5000);

  const batches = [];
  for (let i = 0; i < totalLanguages; i += 4) {
    batches.push(filteredLanguages.slice(i, i + 4));
  }
  await Promise.all(batches.map(batch => deployBatch(batch, deployInfoCopy, totalLanguages)));

  clearInterval(progressInterval);
  let resultMessage = "";
  if (successArr.length) {
    resultMessage += `${successArr.join(",")} 部署成功，`;
  }
  if (errorArr.length) {
    resultMessage += `${errorArr.join(",")} 部署失败。`;
  }
  socket.emit("chat message", {
    type: "deploy-result",
    message: resultMessage,
  });
}

module.exports = deployAllLanguages;
