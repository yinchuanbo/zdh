const { Worker } = require("worker_threads");
const path = require("path");
const io = require("socket.io-client");

let deployInfo;
let successArr = [];
let errorArr = [];
let inProgress = 0;
const socket = io("http://localhost:4001");

const maxLen = 2;

function sendProgressUpdate(total) {
  socket.emit("chat message", {
    type: "deploy-progress",
    message: `部署进度: ${successArr.length + errorArr.length}/${total}，成功: ${successArr.length}，失败: ${errorArr.length}, 成功语言: ${successArr + ""}`,
  });
}

function updateProgress(total) {
  inProgress--;
  sendProgressUpdate(total);
}

// languages 4个元素
function deployBatch(languages, deployInfoCopy, totalLanguages) {
  return new Promise((resolve) => {
    const maxWorkers = Math.min(maxLen, languages.length);
    const workerPool = new Array(maxWorkers)
      .fill()
      .map(() => new Worker(path.join(__dirname, "deployWorker.js")));
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
        console.log("我在关闭线程");
        worker.terminate();
        completedWorkers++;
        console.log("completedWorkers", completedWorkers);
        if (completedWorkers === maxWorkers) {
          resolve();
        }
      }
    }
    for (const worker of workerPool) {
      worker.on("message", (result) => {
        if (result.success) {
          successArr.push(result.language);
        } else {
          console.log("fail3", result);
          errorArr.push(result.language);
        }
        worker.terminate();
        updateProgress(totalLanguages);
        assignTaskToWorker(worker);
      });
      worker.on("error", (error) => {
        console.log("fail4", error);
        errorArr.push("Unknown language due to error." + error?.message);
        worker.terminate();
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

  const progressInterval = setInterval(
    () => sendProgressUpdate(totalLanguages),
    10000
  );

  const batches = [];
  for (let i = 0; i < totalLanguages; i += maxLen) {
    batches.push(filteredLanguages.slice(i, i + maxLen));
  }

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    await deployBatch(batch, deployInfoCopy, totalLanguages);
  }

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
