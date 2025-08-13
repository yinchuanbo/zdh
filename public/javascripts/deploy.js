const allDeploy = document.querySelector(".all-deploy");
const pre = document.querySelector("pre");
let { lans } = pre.dataset;
lans = JSON.parse(lans);
let selectVals = [];

const allBox = document.querySelector("[name='all']");
const lanBox = document.querySelectorAll("[name='checkbox']");
const socket = io(location.host);

function uniqueArray(arr) {
  return [...new Set(arr)];
}

function removeElement(arr, element) {
  const indexToRemove = arr.indexOf(element);
  if (indexToRemove !== -1) {
    arr.splice(indexToRemove, 1);
  }
  return arr;
}

allBox.addEventListener("change", () => {
  const status = allBox.checked;
  if (status) {
    selectVals = lans;
    lanBox.forEach((item) => {
      item.setAttribute("checked", "checked");
      item.checked = true;
    });
  } else {
    selectVals = [];
    lanBox.forEach((item) => {
      item.removeAttribute("checked");
      item.checked = false;
    });
  }
});

lanBox.forEach((item) => {
  item.addEventListener("change", () => {
    const status = item.checked;
    if (status) {
      selectVals.push(item.value);
      selectVals = uniqueArray(selectVals);
      if (selectVals.length >= lans.length) {
        allBox.setAttribute("checked", "checked");
        allBox.checked = true;
      }
    } else {
      selectVals = removeElement(selectVals, item.value);
      allBox.removeAttribute("checked");
      allBox.checked = false;
    }
  });
});

allDeploy.onclick = () => {
  if (!selectVals?.length) {
    new LightTip().error("请选择语言");
    return;
  }
  allDeploy.classList.add("loading");
  fetch("/deploy/deploy-one", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      lan: selectVals,
    }),
  }).then((res) => {
    return res.json();
  });
};

socket.on("connect", () => {
  console.log("Connected to server");
});
socket.on("chat message", (msg) => {
  const { type, message } = msg;
  if (type === "deploy-result") {
    new Dialog({
      title: "Deploy Result",
      content: message,
    });
    allDeploy.classList.remove("loading");
  } else if (type === 'deploy-progress') {
    new LightTip().success(`${message}`);
  }
});

const wrapperBack = document.querySelector(".wrapper__back")
wrapperBack.onclick = () => {
  window.close()
}