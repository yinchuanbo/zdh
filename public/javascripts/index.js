// 添加到文件顶部
// 延迟加载非关键资源
function deferNonCriticalResources() {
  // 使用 requestIdleCallback 延迟加载 Monaco 编辑器
  if ("requestIdleCallback" in window) {
    requestIdleCallback(
      function () {
        require.config({
          paths: {
            vs: "https://unpkg.com/monaco-editor@0.34.1/min/vs",
          },
        });
      },
      { timeout: 2000 }
    );
  }

  // 延迟初始化非关键UI元素
  const nonCriticalElements = document.querySelectorAll(
    ".nav_a:not(.select-all-btn):not(.handle-btn)"
  );
  nonCriticalElements.forEach((el) => {
    el.style.opacity = "0.7";
    setTimeout(() => {
      el.style.opacity = "1";
      el.style.transition = "opacity 0.3s ease";
    }, 500);
  });
}

// 在页面加载时初始化
window.addEventListener("load", deferNonCriticalResources);

// 添加性能监控
if (window.performance && window.performance.mark) {
  window.performance.mark("start_app");
  window.addEventListener("load", function () {
    window.performance.mark("end_app");
    window.performance.measure("app_load_time", "start_app", "end_app");
    const loadTime =
      window.performance.getEntriesByName("app_load_time")[0].duration;
    console.log("应用加载时间: " + loadTime.toFixed(2) + "ms");
  });
}

const socket = io("http://localhost:4001");
let imgs = [];
let isWatching = false;

let editor = null,
  jsonEditor = null,
  isc = false,
  imageExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".bmp",
    ".svg",
    ".ico",
    ".tiff",
    ".tif",
    ".heic",
    ".avif",
    // 主流格式
    ".mp4",
    ".m4v",
    ".mov",
    ".avi",
    ".mkv",
    ".flv",
    ".webm",
    // 专业/旧格式
    ".wmv",
    ".mpg",
    ".mpeg",
    ".m2ts",
    ".ts",
    ".vob",
    ".3gp",
    ".3g2",
    // 高清/流媒体
    ".h264",
    ".hevc",
    ".avchd",
    ".ogv",
    ".mxf",
    // 苹果相关
    ".qt",
    ".f4v",
  ];
const vsCodes = document.querySelectorAll(".vs-code");
const openSite = document.querySelectorAll(".open-site");
function isImageFile(filepath) {
  const ext = "." + filepath.split(".").pop().toLowerCase();
  return imageExtensions.includes(ext);
}

const watchBtn = document.querySelector(".watch-btn");
const arSwitchCss = document.querySelector(".ar-switch-css");
const selectAllBtn = document.querySelector(".select-all-btn");
const handleBtn = document.querySelector(".handle-btn");
const allPublish = document.querySelector(".all-publish");
const allDiscard = document.querySelector(".all-discard");
const allPull = document.querySelector(".all-pull");
const allPush = document.querySelector(".all-push");
const OneClick = document.querySelector(".One-click");
const getUrlName = document.querySelector(".get-url-name");

let selectLan = document.querySelector(".wrappper__sider_01 select").value;

let isFirst = false;

let curP = null;

let dataInfo = {};
let data2Info = {};

function openFullScreenWindow(url) {
  const isWeb = false; // Running as web application
  if (!isWeb) {
    window.open(url, "_blank");
  } else {
    const newWindow = window.open(
      url,
      "_blank",
      "width=" +
        window.screen.width +
        ",height=" +
        window.screen.height +
        ",left=0,top=0"
    );
    if (newWindow) {
      newWindow.focus();
    } else {
      alert("请允许弹出窗口");
    }
  }
}

const setWatch = () => {
  fetch("/watching?bool=" + isWatching);
};

const closeWatch = () => {
  isWatching = false;
  if (isWatching) {
    watchBtn.classList.add("watching");
  } else {
    watchBtn.classList.remove("watching");
  }
  setWatch();
};

const watchBtnListen = () => {
  watchBtn.onclick = () => {
    isWatching = !isWatching;
    if (isWatching) {
      watchBtn.classList.add("watching");
    } else {
      watchBtn.classList.remove("watching");
    }
    setWatch();
  };
};

const handleSocket = () => {
  socket.on("connect", () => {
    console.log("Connected to server");
  });
  socket.on("chat message", (msg) => {
    const { type, message, file } = msg;
    console.log("----------", msg);
    if (type === "watch error") {
      closeWatch();
      new Dialog({
        title: "Error Info",
        content: message + "-" + file,
      });
    } else if (type === "publish success") {
      new LightTip().success("publish 成功");
    } else if (type === "publish error") {
      new Dialog({
        title: "Publish Error Info",
        content: message || "publish 失败",
      });
    } else if (type === "all-publish") {
      new Dialog({
        title: "Publish Info",
        content: message,
      });
      allPublish.classList.remove("loading");
    } else if (type === "all-pull") {
      new Dialog({
        title: "Pull Info",
        content: message,
      });
      allPull.classList.remove("loading");
    } else if (type === "all-discard") {
      new Dialog({
        title: "Discard Info",
        content: message,
      });
      allDiscard.classList.remove("loading");
    } else if (type === "all-push") {
      new Dialog({
        title: "Push Info",
        content: message,
      });
      allPush.classList.remove("loading");
      allPush.classList.remove("loading");
      const saveBtn = document.querySelector(".setCommit .ui-button-primary");
      const cancelBtn = document.querySelector(".setCommit .ui-button-warning");
      if (saveBtn && cancelBtn) {
        cancelBtn.classList.remove("disabled");
        saveBtn.classList.remove("loading");
      }
    } else if (type === "upload-ftp-success") {
      const toTest = document.querySelector(
        ".getUrlName .getUrlName-popup .to-test"
      );
      if (toTest) {
        new Dialog({
          title: "Ftp Success Info",
          content: message,
        });
        toTest.classList.remove("loading");
      }
    } else if (type === "ftp-upload-progress") {
      new LightTip().success(`${message}`);
    }
  });
};

function generateRandomString(length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
}

function getRandomHexColor() {
  let randomColor;
  const brightnessThreshold = 127;
  let brightness;
  do {
    randomColor = Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0");
    const r = parseInt(randomColor.substr(0, 2), 16);
    const g = parseInt(randomColor.substr(2, 2), 16);
    const b = parseInt(randomColor.substr(4, 2), 16);
    brightness = 0.299 * r + 0.587 * g + 0.114 * b;
  } while (brightness > brightnessThreshold);
  return `#${randomColor}`;
}

function keepFirstOfConsecutive(arr) {
  return arr.filter((num, index) => index === 0 || num !== arr[index - 1] + 1);
}

const createContent = (
  lan = "en",
  data = [],
  data2 = {},
  data3 = {},
  data4 = {},
  initLan = "en",
  _idx = 0
) => {
  dataInfo = data;
  data2Info = data2;
  if (!(data2Info?.[initLan] && Object.keys(data2).length === 1)) {
    OneClick.classList.remove("disabled");
  }
  const header = document.querySelector(".wrappper__content-header");
  const content = document.querySelector(".wrappper__content-content");
  const curDatas2 = data2[lan];

  let isIdx = _idx === 0;

  const html01 = `<div class="header-item ${isIdx ? "active" : ""}">${lan}<span title="${data3[lan]}">${data3[lan]}</span><div>`;
  const html02 = `<div class="content-item ${isIdx ? "active" : ""}">
    <div class="content-item-btns">
      <a href="javascript:" class="nav_a pull-code" title="Pull Code" role="button" data-lan="${lan}"><svg t="1732776571987" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="6130" width="20" height="20"><path d="M260.352 431.616c-96.64 0-175.04-77.824-175.04-172.288 0-94.464 78.336-174.016 175.04-174.016a174.464 174.464 0 0 1 174.976 174.016c0 96.064-80 172.288-174.976 172.288z m0-246.848c-41.664 0-75.008 33.152-75.008 74.56s33.28 74.56 75.008 74.56c41.6 0 75.008-33.152 75.008-74.56a75.52 75.52 0 0 0-75.008-74.56zM765.312 933.76a174.464 174.464 0 0 1-174.976-174.08c0-96.064 78.336-172.288 174.976-172.288a174.464 174.464 0 0 1 175.04 173.952c0 96.128-80 172.352-175.04 172.352z m0-246.912c-41.6 0-74.944 33.088-74.944 74.56 0 41.408 33.28 74.56 74.944 74.56s75.008-33.152 75.008-74.56a75.52 75.52 0 0 0-75.008-74.56z" fill="#ffffff" p-id="6131"></path><path d="M260.352 938.688a48.96 48.96 0 0 1-49.984-49.728V386.88c0-28.16 21.632-49.664 49.92-49.664 28.352 0 50.048 21.504 50.048 49.664v502.08a51.136 51.136 0 0 1-49.984 49.728zM765.312 686.848a48.96 48.96 0 0 1-49.92-49.728v-278.4a48.96 48.96 0 0 0-50.048-49.664H383.68a48.96 48.96 0 0 1-49.984-49.728c0-28.16 21.632-49.728 49.92-49.728h281.728a148.928 148.928 0 0 1 150.016 149.12v280.064c0 26.496-23.36 48-50.048 48z" fill="#ffffff" p-id="6132"></path></svg></a>
      <a href="javascript:" class="nav_a discard-code" title="Discard Code" role="button" data-lan="${lan}" style="display: ${selectLan === lan ? "none" : ""}"><svg t="1732769144663" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="12811" width="20" height="20"><path d="M224 128v224L256 384h224V320H318.656l60.224-60.224a227.328 227.328 0 1 1 321.472 321.472L367.744 913.92l46.08 46.08 332.672-332.672A292.48 292.48 0 0 0 332.8 213.696l-44.8 44.8V128h-64z" p-id="12812" fill="#ffffff"></path></svg></a>
      <a href="javascript:" class="nav_a commit-code" role="button" data-lan="${lan}" style="display: none">Commit</a>
      <a href="javascript:" class="nav_a merge-code" role="button" title="Merge" data-lan="${lan}"><svg t="1732776414456" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4521" width="20" height="20"><path d="M768 938.666667c-93.866667 0-170.666667-76.8-170.666667-170.666667s76.8-170.666667 170.666667-170.666667 170.666667 76.8 170.666667 170.666667-76.8 170.666667-170.666667 170.666667z m0-256c-46.933333 0-85.333333 38.4-85.333333 85.333333s38.4 85.333333 85.333333 85.333333 85.333333-38.4 85.333333-85.333333-38.4-85.333333-85.333333-85.333333zM256 426.666667c-93.866667 0-170.666667-76.8-170.666667-170.666667s76.8-170.666667 170.666667-170.666667 170.666667 76.8 170.666667 170.666667-76.8 170.666667-170.666667 170.666667z m0-256c-46.933333 0-85.333333 38.4-85.333333 85.333333s38.4 85.333333 85.333333 85.333333 85.333333-38.4 85.333333-85.333333-38.4-85.333333-85.333333-85.333333z" fill="#ffffff" p-id="4522"></path><path d="M256 938.666667c-25.6 0-42.666667-17.066667-42.666667-42.666667V384c0-25.6 17.066667-42.666667 42.666667-42.666667s42.666667 17.066667 42.666667 42.666667c0 187.733333 153.6 341.333333 341.333333 341.333333s42.666667 17.066667 42.666667 42.666667-17.066667 42.666667-42.666667 42.666667c-140.8 0-264.533333-68.266667-341.333333-170.666667v256c0 25.6-17.066667 42.666667-42.666667 42.666667z" fill="#ffffff" p-id="4523"></path></svg></a>
      <a href="javascript:" class="nav_a push-code" role="button" title="Commit + Push" data-lan="${lan}"><svg t="1729842032932" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="8172" width="30" height="30"><path d="M725.333333 512a213.333333 213.333333 0 0 1-170.666666 209.066667V896h-85.333334v-174.933333a213.333333 213.333333 0 0 1 0-418.133334V128h85.333334v174.933333a213.333333 213.333333 0 0 1 170.666666 209.066667m-213.333333-128a128 128 0 0 0-128 128 128 128 0 0 0 128 128 128 128 0 0 0 128-128 128 128 0 0 0-128-128z" fill="#ffffff" p-id="8173"></path></svg> + <svg t="1732769230557" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="13897" width="20" height="20"><path d="M311.466667 414.848c7.68 7.68 18.773333 12.373333 30.293333 12.373333l-0.426667-0.426666c11.093333 0 22.186667-4.693333 30.250667-12.373334l98.005333-98.048v494.336c0 23.466667 18.773333 42.624 42.624 42.624 23.466667 0 42.624-19.2 42.624-42.624V317.269333l97.536 97.578667c7.68 7.68 18.773333 12.373333 30.250667 12.373333l-0.426667-0.853333c11.093333 0 22.186667-4.693333 30.250667-12.373333h0.426667a42.453333 42.453333 0 0 0 0-60.074667L542.421333 183.466667c-8.533333-8.576-19.626667-12.842667-30.592-12.8a41.813333 41.813333 0 0 0-30.293333 12.8L311.04 353.92v0.426667a42.581333 42.581333 0 0 0 0.426667 60.501333z" p-id="13898" fill="#ffffff"></path></svg></a>
      <a href="javascript:" class="nav_a dey-to-test" role="button" data-lan="${lan}" style="display: none">上传至 ${lan} Test Ftp</a>
      <a href="javascript:" class="nav_a dey-to-pro" role="button" data-lan="${lan}" style="display: none">上传至 ${lan} Pro Ftp</a>
      <a href="javascript:" class="nav_a all-img" style="display: ${selectLan === lan ? "none" : ""}" title="Resource Async" role="button" data-lan="${lan}"><svg t="1729820839670" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="19174" width="30" height="30"><path d="M636.330667 133.717333c99.072 9.898667 178.773333 69.674667 195.669333 172.117334h-57.344l92.672 137.984L960 305.834667h-63.914667c-17.066667-137.984-121.429333-227.626667-253.226666-240.426667-18.218667-1.408-35.157333 14.208-35.157334 34.133333 1.194667 17.066667 12.885333 32.725333 28.586667 34.133334zM450.133333 64H127.914667c-18.261333 0-32.554667 15.616-32.554667 35.584v307.2c0 19.968 14.293333 35.584 32.554667 35.584h322.261333c18.218667 0 32.554667-15.616 32.554667-35.584v-307.2c0-19.968-14.336-35.584-32.554667-35.584z m-31.36 310.101333H159.274667V132.266667H418.986667l-0.128 241.834666zM387.413333 888.96c-110.933333-9.898667-195.712-83.882667-199.68-206.250667h61.312l-92.416-137.813333L64 682.666667h61.312c2.474667 157.909333 113.408 260.352 255.701333 274.56 18.218667 1.408 35.157333-14.208 35.157334-34.133334a33.877333 33.877333 0 0 0-28.714667-34.133333z m509.824-308.650667h-322.261333c-18.346667 0-32.554667 15.786667-32.554667 35.584v308.650667c0 19.84 14.293333 35.413333 32.554667 35.413333h322.261333c18.218667 0 32.554667-15.573333 32.554667-35.413333v-308.650667c0-19.84-15.616-35.584-32.554667-35.584z m-31.402666 310.101334H606.293333v-240.384h259.626667v240.384z" p-id="19175" fill="#ffffff"></path></svg></a>
      <a href="javascript:" class="nav_a publish" title="Publish" role="button" data-lan="${lan}"><svg t="1729820784129" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="18059" width="30" height="30"><path d="M939.52 22.752L28.448 392.256l173.792 164.416 53.76-55.456-86.464-81.92L783.648 170.112 173.504 750.368h-1.984V1024h76.224v-237.792l115.488-109.504 55.744-53.184L937.248 131.136l-86.752 89.6-94.432 319.712L655.648 879.232l-118.912-112.64-53.76 55.456 210.496 199.104 224.416-759.168L995.552 0l-56.032 22.752z" p-id="18060" fill="#ffffff"></path></svg></a>
    </div>
    <ul>
      ${data
        .map((info) => {
          const str = generateRandomString(20);
          let lujing = curDatas2?.[info] || "unknown";
          if (selectLan === lan) lujing = info;
          let fileN = info.split("/") || [];
          let lineVal = "";
          if (!fileN || !fileN?.length) {
            lineVal = "";
          } else {
            lineVal = data4?.[fileN.at(-1)] || [];
            lineVal = lineVal.sort((a, b) => a - b);
            lineVal = [...new Set(lineVal)];
            lineVal = keepFirstOfConsecutive(lineVal);
            lineVal = lineVal + "";
          }
          return `<li data-path="${info}" data-path2="${lujing}" data-lan="${lan}" data-lines="${lineVal}">
          <div class="check-handle" title="已完成可选中">
            <input type="checkbox" id="${str}" name="${str}">
            <label for="${str}" class="ui-checkbox"></label>
          </div>
          <div class="filename">
            <div class="tpl__ele_origin" title="[${initLan}] ${info}">[${initLan}] ${info}</div>
            <!--<div class="tpl__ele_arrow">↓</div>-->
            <div class="tpl__ele" title="[${lan}] ${lujing}" data-es="${info.endsWith(".tpl") && selectLan !== lan ? "tpl" : ""}">[${lan}] ${lujing}</div>
          </div>
          <div class="btns">
           <a href="javascript:" class="nav_a async-res" style="display: ${selectLan === lan ? "none" : ""}" role="button">${isImageFile(info) ? "SYNC" : "DIFF"}</a>
           <a href="javascript:" class="nav_a one-deploy" role="button" title="Deylop To Test Env" style="display: ${info.endsWith(".json") ? "none" : ""}">TEST</a>
           <a href="javascript:" class="ui-button ui-button-warning delete" style="display: none" role="button">Delete</a>
          </div>
        </li>`;
        })
        .join("")}
    </ul>
  </div>`;

  let active01 = document.querySelector(".header-item.active");
  let active02 = document.querySelector(".content-item.active");

  if (isIdx) {
    if (active01) active01.classList.remove("active");
    if (active02) active02.classList.remove("active");
  }

  header.insertAdjacentHTML("beforeend", html01);
  content.insertAdjacentHTML("beforeend", html02);

  const allHeaderItem = document.querySelectorAll(".header-item");
  const allContentItem = document.querySelectorAll(".content-item");

  const asyncRes = document.querySelectorAll(".async-res");
  const deyToTest = document.querySelectorAll(".dey-to-test");

  const allImg = document.querySelectorAll(".all-img");
  const publishs = document.querySelectorAll(".publish");

  const oneDeploy = document.querySelectorAll(".one-deploy");

  const tplEles = document.querySelectorAll(".tpl__ele");

  const pullCodes = document.querySelectorAll(".pull-code");
  const pushCodes = document.querySelectorAll(".push-code");
  const commitCode = document.querySelectorAll(".commit-code");
  const discardCode = document.querySelectorAll(".discard-code");
  const mergeCodes = document.querySelectorAll(".merge-code");
  const deleteFiles = document.querySelectorAll(".delete");

  new Tips($(".jsRTips"), {
    align: "top",
  });

  tplEles.forEach((item) => {
    item.onclick = () => {
      const { es } = item.dataset;
      item.setAttribute("contentEditable", true);
    };
    item.oninput = () => {
      let path = item.innerText.split("]")[1] || "";
      path = path.trim();
      const p = item.parentNode.parentNode;
      p.setAttribute("data-path2", path);
    };
    item.onblur = () => {
      item.removeAttribute("contentEditable");
    };
  });

  allHeaderItem.forEach((item, idx) => {
    item.onclick = () => {
      active01 = document.querySelector(".header-item.active");
      active02 = document.querySelector(".content-item.active");
      if (active01) active01.classList.remove("active");
      if (active02) active02.classList.remove("active");
      item.classList.add("active");
      allContentItem[idx].classList.add("active");
    };
  });

  asyncRes.forEach((item) => {
    item.onclick = () => {
      if (!isWatching) {
        new LightTip().error("请点击开启 Watch 监听");
        return;
      }
      item.classList.add("loading");
      const p = item.parentNode.parentNode;
      curP = p;
      const { path, lan, path2, lines } = p.dataset;
      fetch("/receive-files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path,
          path2,
          lan,
          initLan,
        }),
      })
        .then((res) => {
          return res.json();
        })
        .then((res) => {
          if (res.code === 200 && res.message === "ok") {
            p.querySelector(".check-handle input").checked = true;
            new LightTip().success("同步成功");
          } else if (res.code === 200 && res.message === "processing") {
            if (jsonEditor) jsonEditor.dispose();
            if (originalModel) originalModel.dispose();
            if (modifiedModel) modifiedModel.dispose();
            if (diffEditor) diffEditor.dispose();
            modifiedModel = null;
            originalModel = null;
            diffEditor = null;
            jsonEditor = null;
            diffHTML(res.data, lan, path, initLan, lines);
          } else if (res.code === 200 && res.message === "error") {
            new LightTip().error(res?.data);
          }
          item.classList.remove("loading");
        })
        .catch((err) => {
          console.log("err", err);
          item.classList.remove("loading");
        });
    };
  });

  deyToTest.forEach((item) => {
    item.onclick = () => {
      const lan = item.dataset.lan;
      item.classList.add("loading");
      fetch("/deploy-to-ftp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          env: "test",
          lan,
          data: Object.values(data2Info[lan]),
        }),
      })
        .then((res) => {
          return res.json();
        })
        .then((res) => {
          item.classList.remove("loading");
          if (res?.code === 200 && res?.message === "deploy-success") {
            new LightTip().success("测试环境部署成功");
          } else {
            new LightTip().success(res?.data || "测试环境部署失败");
          }
        });
    };
  });

  allImg.forEach((item) => {
    item.onclick = () => {
      const { lan } = item.dataset;
      if (!imgs?.length) {
        new LightTip().error("此次未涉及到图片等资源修改");
        return;
      }
      item.classList.add("loading");
      fetch("/receive-imgs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lan,
          imgs,
          initLan,
        }),
      })
        .then((res) => {
          return res.json();
        })
        .then((res) => {
          if (res?.code === 200 && res?.message === "async-imgs-success") {
            const selector = imageExtensions
              .map((ext) => `li[data-lan="${lan}"][data-path$="${ext}"]`)
              .join(", ");
            const elements = document.querySelectorAll(selector);
            if (elements?.length) {
              elements.forEach((item) => {
                item.querySelector(".check-handle input").checked = true;
              });
            }
            new LightTip().success("图片批量同步成功");
          } else {
            new LightTip().error("图片批量同步失败");
          }
          item.classList.remove("loading");
        });
    };
  });

  publishs.forEach((publish) => {
    publish.onclick = () => {
      publish.classList.add("loading");
      const { lan } = publish.dataset;
      fetch("/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lan,
        }),
      })
        .then((res) => {
          return res.json();
        })
        .then((res) => {
          if (res?.code === 200 && res?.message === "publish-success") {
            new LightTip().success(lan + " Publish 成功");
          } else {
            // new LightTip().error(res?.data || lan + " Publish 失败");
            new Dialog({
              title: "Publish Error Info",
              content: res?.data || lan + " Publish 失败",
            });
          }
          publish.classList.remove("loading");
        });
    };
  });

  function convertTplToHtml(fileName) {
    return fileName.replace(/^tpl\//, "").replace(/\.tpl$/, ".html");
  }

  oneDeploy.forEach((item) => {
    item.onclick = () => {
      const { path2, path, lan } = item.parentNode.parentNode.dataset;
      if (path.startsWith("tpl/")) {
        if (
          !path2.startsWith("tpl/") ||
          !path2.endsWith(".tpl") ||
          path2.trim() === "tpl/.tpl"
        ) {
          new LightTip().error(`Tpl 文件名不合法`);
          return;
        }
      }
      let urlPath = path2.includes("tpl/") ? convertTplToHtml(path2) : path2;
      urlPath = urlPath.startsWith("Dev/")
        ? urlPath.replace("Dev/", "")
        : urlPath;
      urlPath = urlPath.startsWith("scss/")
        ? urlPath.replaceAll("scss", "css")
        : urlPath;
      item.classList.add("loading");
      fetch("/deploy-to-ftp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          env: "test",
          lan,
          data: [urlPath],
        }),
      })
        .then((res) => {
          return res.json();
        })
        .then((res) => {
          item.classList.remove("loading");
          if (res?.code === 200 && res?.message === "deploy-success") {
            new LightTip().success(`测试环境部署成功`);
          } else {
            new LightTip().error(res?.data || "测试环境部署失败");
          }
        });
    };
  });

  pullCodes.forEach((item) => {
    item.onclick = () => {
      if (isWatching) {
        new LightTip().error("请先关闭 Watching，其他操作需要开启");
        return;
      }
      item.classList.add("loading");
      const { lan } = item.dataset;
      fetch("/pull-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lan,
        }),
      })
        .then((res) => {
          return res.json();
        })
        .then((res) => {
          if (res?.code === 200 && res?.message === "pull-success") {
            new LightTip().success(res?.data || lan + " Pull 成功");
          } else {
            new LightTip().error(res?.data || lan + " Pull 失败");
          }
          item.classList.remove("loading");
        });
    };
  });

  discardCode.forEach((item) => {
    item.onclick = () => {
      if (isWatching) {
        new LightTip().error("请先关闭 Watching，其他操作需要开启");
        return;
      }
      // item.classList.add("loading");
      const { lan } = item.dataset;
      new Dialog().confirm(
        '\
        <h6>是否一并取消暂存区文件？</h6>\
        <input type="checkbox" id="switchS"><label class="ui-switch" for="switchS"></label>',
        {
          buttons: [
            {
              events: function (event) {
                const switchDom = document.querySelector("#switchS");
                const isChecked = switchDom.checked;
                fetch("/discard-code", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    lan,
                    isChecked,
                  }),
                })
                  .then((res) => {
                    return res.json();
                  })
                  .then((res) => {
                    if (
                      res?.code === 200 &&
                      res?.message === "discard-success"
                    ) {
                      new LightTip().success(res?.data || "代码撤销成功");
                    } else {
                      new LightTip().error(res?.data || "代码撤销失败");
                    }
                    // item.classList.remove("loading");
                    event.data.dialog.remove();
                  });
              },
            },
            {},
          ],
        }
      );
    };
  });

  pushCodes.forEach((item) => {
    item.onclick = async () => {
      const { lan } = item.dataset;
      if (isWatching) {
        new LightTip().error("请先关闭 Watching，其他操作需要开启");
        return;
      }
      // item.classList.add("loading");
      const { code, message, data } = await fetch("/check-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lan,
        }),
      }).then((res) => {
        return res.json();
      });
      if (!(code === 200 && message === "check-status-success")) {
        removeLoading("操作失败");
        return;
      }
      setCommit(item, lan, data, { code, message, data });
    };
  });

  mergeCodes.forEach((item) => {
    item.onclick = () => {
      if (isWatching) {
        new LightTip().error("请先关闭 Watching，其他操作需要开启");
        return;
      }
      // item.classList.add("loading");
      const { lan } = item.dataset;
      setMerge(item, lan);
    };
  });

  deleteFiles.forEach((item) => {
    item.onclick = () => {
      const { path2, lan } = item.parentNode.parentNode.dataset;
      fetch("/delete-file", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path2,
          lan,
        }),
      })
        .then((res) => {
          return res.json();
        })
        .then((res) => {
          const { message, data } = res;
          if (message === "delete-success") {
            new LightTip().success("删除成功");
            item.parentNode.parentElement.remove();
          } else {
            new LightTip().error(data);
          }
        });
    };
  });
};

vsCodes.forEach((item) => {
  item.onclick = () => {
    const { lan } = item.dataset;
    fetch("/open-vscode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lan,
      }),
    });
  };
});
openSite.forEach((item) => {
  item.onclick = () => {
    const { lan } = item.dataset;
    fetch("/open-site", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lan,
      }),
    })
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        if (res?.data) {
          copyToClipboard(res.data);
        }
      });
  };
});

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        new LightTip().success("复制成功");
      })
      .catch((err) => {
        new LightTip().error("复制失败");
      });
  }
}

const setCommit = (item, lan, hasCommit = false, result = {}) => {
  let type = "";
  const html = `
    <div class="setCommit">
      <div class="setCommit_left">
        <div class="select-type">
          <div class="select-type-item">
            <input type="radio" id="radio1" name="handle-type" value="commit" ${hasCommit ? `disabled` : ""} ${!hasCommit ? `checked="checked"` : ""}>
            <label for="radio1" class="ui-radio"></label><label for="radio1" style="padding-left: 5px;">Commit</label>
          </div>
          <div class="select-type-item">
            <input type="radio" id="radio2"  value="push" name="handle-type" ${hasCommit ? `checked="checked"` : ""}>
            <label for="radio2" class="ui-radio"></label><label for="radio2" style="padding-left: 5px;">Push</label>
          </div>
        </div>
        <div class="set-commit-comtent">
          <select name="commit__style" ${hasCommit ? `disabled` : ""}>
            <option class="feat" title="新功能 feature">feat</option>
            <option class="fix" title="修复 bug">fix</option>
            <option class="docs" title="文档注释">docs</option>
            <option class="style" title="代码格式(不影响代码运行的变动)">style</option>
            <option class="refactor" title="重构、优化(既不增加新功能，也不是修复bug)">refactor</option>
            <option class="perf" title="性能优化">perf</option>
            <option class="test" title="增加测试">test</option>
            <option class="chore" title="构建过程或辅助工具的变动">chore</option>
            <option class="revert" title="回退">revert</option>
            <option class="build" title="打包">build</option>
          </select>
          <input class="ui-input commit-input"  ${hasCommit ? `disabled` : ""} placeholder="输入 commit 内容">
        </div>
      </div>
      <div class="setCommit_btns">
        <a href="javascript:" class="ui-button ui-button-primary" role="button">Send</a>
        <a href="javascript:" class="ui-button ui-button-warning red_button" role="button">Cancel</a>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", html);
  const setCommit = document.querySelector(".setCommit");
  const saveBtn = document.querySelector(".setCommit .ui-button-primary");
  const cancelBtn = document.querySelector(".setCommit .ui-button-warning");
  const select = document.querySelector('[name="commit__style"]');
  const input = setCommit.querySelector(".commit-input");
  function removeLoading(str = "", bool = false) {
    if (bool) {
      new LightTip().success(str);
    } else {
      new LightTip().error(str);
    }
    saveBtn.classList.remove("loading");
    cancelBtn.classList.remove("disabled");
  }
  saveBtn.onclick = async () => {
    const radio = document.querySelector("input[name='handle-type']:checked");
    if (!input.value && !hasCommit) {
      removeLoading("必须填写 commit 内容");
      return;
    }
    saveBtn.classList.add("loading");
    cancelBtn.classList.add("disabled");

    const { code, message, data } = result;
    if (!(code === 200 && message === "check-status-success")) {
      removeLoading("操作失败");
      return;
    }
    if (radio.value === "commit") {
      if (data) {
        removeLoading("无修改可用来 commit");
        return;
      } else {
        type = "commit";
      }
    } else if (radio.value === "push") {
      if (data) {
        console.log("111-1");
        fetch("/push-code", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lan,
            status: true,
          }),
        })
          .then((res) => {
            return res.json();
          })
          .then((res) => {
            if (res?.code === 200 && res?.message === "push-success") {
              removeLoading(res?.data || lan + " Push 成功", true);
            } else {
              removeLoading(res?.data || lan + " Push 失败");
            }
            item.classList.remove("loading");
          });
        return;
      }
    }
    console.log("111-2");
    const content = `${select.value}:${input.value}`;
    fetch("/push-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lan,
        commit: content,
        type,
      }),
    })
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        if (res?.code === 200 && res?.message === "push-success") {
          removeLoading(res?.data || lan + " Push 成功", true);
          item.classList.remove("loading");
          setCommit.remove();
        } else {
          removeLoading(res?.data || lan + " Push 失败");
        }
      });
  };
  cancelBtn.onclick = () => {
    item.classList.remove("loading");
    setCommit.remove();
  };
};

const setMerge = (item, lan) => {
  fetch("/get-branchs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      lan,
    }),
  })
    .then((res) => {
      return res.json();
    })
    .then((res) => {
      if (res?.code === 200 && res.message === "get-branchs-success") {
        renderHtml(res?.data || []);
      }
    });
  function renderHtml(data = []) {
    const html = `
      <div class="setCommit setMerge">
        <div class="setCommit_left">
          <select name="from">
              ${data.map((h) => {
                return `<option class="feat" value="${h}" title="${h}">${h}</option>`;
              })}
          </select>
          <p>Mergr To</p>
          <select name="to">
          ${data.map((h) => {
            return `<option class="feat" value="${h}" title="${h}">${h}</option>`;
          })}
          </select>
        </div>
        <div class="setCommit_btns">
          <a href="javascript:" class="ui-button ui-button-primary" role="button">Merge</a>
          <a href="javascript:" class="ui-button ui-button-warning red_button" role="button">Cancel</a>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", html);
    const setCommit = document.querySelector(".setCommit");
    const saveBtn = document.querySelector(".setCommit .ui-button-primary");
    const cancelBtn = document.querySelector(".setCommit .ui-button-warning");
    const selectFrom = document.querySelector('[name="from"]');
    const selectTo = document.querySelector('[name="to"]');

    saveBtn.onclick = () => {
      if (selectFrom.value.trim() === selectTo.value.trim()) {
        new LightTip().error("分支名不能相同");
        return;
      }
      saveBtn.classList.add("loading");
      cancelBtn.classList.add("disabled");
      fetch("/merge-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lan,
          from: selectFrom.value.trim(),
          to: selectTo.value.trim(),
        }),
      })
        .then((res) => {
          return res.json();
        })
        .then((res) => {
          if (res?.code === 200 && res?.message === "merge-success") {
            new LightTip().success(res?.data || lan + " merge 成功");
            saveBtn.classList.remove("loading");
            item.classList.remove("loading");
            cancelBtn.classList.remove("disabled");
            setCommit.remove();
          } else {
            new LightTip().error(res?.data || lan + " merge 失败");
            saveBtn.classList.remove("loading");
            cancelBtn.classList.remove("disabled");
          }
        });
    };

    cancelBtn.onclick = () => {
      item.classList.remove("loading");
      setCommit.remove();
    };
  }
};

let originalModel,
  modifiedModel,
  diffEditor,
  diffNavigator,
  originalEditor,
  markedLines,
  originalDecorations = [];

function setEditorNavitor() {
  if (!diffEditor) return;
  let currentDiffIndex = -1;
  let lineChanges = [];
  // 监听差异更新
  diffEditor.onDidUpdateDiff(() => {
    lineChanges = diffEditor.getLineChanges() || [];
    currentDiffIndex = -1; // 重置索引
  });
  // 跳转到下一个差异
  function goToNextDiff() {
    if (lineChanges.length === 0) return;
    currentDiffIndex = Math.min(currentDiffIndex + 1, lineChanges.length - 1);
    const change = lineChanges[currentDiffIndex];
    diffEditor.revealLineInCenter(change.modifiedStartLineNumber);
    diffEditor.getModifiedEditor().setPosition({
      lineNumber: change.modifiedStartLineNumber,
      column: 1,
    });
    diffEditor.getModifiedEditor().focus();
  }

  // 跳转到上一个差异
  function goToPreviousDiff() {
    if (lineChanges.length === 0) return;
    currentDiffIndex = Math.max(currentDiffIndex - 1, 0);
    const change = lineChanges[currentDiffIndex];
    diffEditor.revealLineInCenter(change.modifiedStartLineNumber);
    diffEditor.getModifiedEditor().setPosition({
      lineNumber: change.modifiedStartLineNumber,
      column: 1,
    });
    diffEditor.getModifiedEditor().focus();
  }

  Prev.onclick = goToPreviousDiff;
  Next.onclick = goToNextDiff;
}

function setEditor(path = "", modifiedText = "", originalText = "") {
  if (originalModel) originalModel.dispose();
  if (modifiedModel) modifiedModel.dispose();
  if (diffEditor) diffEditor.dispose();

  modifiedModel = null;
  originalModel = null;
  diffEditor = null;
  diffNavigator = null;

  require.config({
    paths: {
      vs: "https://unpkg.com/monaco-editor@0.34.1/min/vs",
    },
  });

  const extensionToLanguageMap = {
    ".js": "javascript",
    ".css": "css",
    ".scss": "scss",
    ".json": "json",
    ".tpl": "html",
  };

  const lan =
    Object.keys(extensionToLanguageMap).find((ext) => path.endsWith(ext)) ||
    "text/plain";

  require(["vs/editor/editor.main"], function () {
    originalModel = monaco.editor.createModel(
      originalText,
      extensionToLanguageMap[lan]
    );
    modifiedModel = monaco.editor.createModel(
      modifiedText,
      extensionToLanguageMap[lan]
    );

    diffEditor = monaco.editor.createDiffEditor(
      document.querySelector("#compare"),
      {
        theme: "vs-dark",
        scrollBeyondLastLine: false,
        diffWordWrap: true,
        wordWrap: "on",
        enableSplitViewResizing: false,
        originalEditable: true,
        automaticLayout: true,
        fontSize: 16,
        lineHeight: 1.5,
        formatOnPaste: true,
        glyphMargin: true,
        selectOnLineNumbers: true,
        enableSplitViewResizing: true,
        ignoreTrimWhitespace: true,
        renderIndicators: true,
      }
    );

    diffEditor.setModel({
      original: originalModel,
      modified: modifiedModel,
    });

    // 获取左侧编辑器
    originalEditor = diffEditor.getOriginalEditor();

    // 从 localStorage 读取上次的标记行
    markedLines = JSON.parse(localStorage.getItem("markedLines") || "{}");
    if (!markedLines?.[path]) markedLines[path] = [];
    // 添加标记
    function applyMarks(lines) {
      if (!originalEditor) return;
      const newDecs = lines.map((line) => ({
        range: new monaco.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          className: "myLineHighlight",
          glyphMarginClassName: "myGlyphMargin",
        },
      }));
      // 保存返回的装饰 id（下次用来移除或更新）
      originalDecorations = originalEditor.deltaDecorations(
        originalDecorations,
        newDecs
      );
      markedLines[path] = lines.slice();
      localStorage.setItem("markedLines", JSON.stringify(markedLines));
    }

    applyMarks(markedLines[path]);

    // 点击左侧行号或 glyphMargin 时添加/删除标记
    originalEditor.onMouseDown((e) => {
      if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
        const lineNumber = e.target.position.lineNumber;
        console.log("====", markedLines, path);
        const idx = markedLines[path].indexOf(lineNumber);
        if (idx === -1) {
          markedLines[path].push(lineNumber);
        } else {
          markedLines[path].splice(idx, 1);
        }
        localStorage.setItem("markedLines", JSON.stringify(markedLines));
        applyMarks(markedLines[path]);
      }
    });

    // 差异导航器
    diffNavigator = monaco.editor.createDiffNavigator(diffEditor, {
      followsCaret: true,
      ignoreCharChanges: true,
      alwaysRevealFirst: true,
    });
  });
}

// 启用代码收缩功能
function enableCodeFolding(model) {
  const foldingOptions = {
    lineNumbers: "on",
    foldingStrategy: "indentation", // 可选: "indentation" 或 "auto"
  };
  model.updateOptions({
    folding: foldingOptions,
  });
}

const diffHTML = function (
  data = {},
  lan = "",
  path = "",
  initLan = "",
  lines = ""
) {
  let doc = null;
  let linesArr = [];
  if (lines) {
    linesArr = lines.split(",");
    linesArr = linesArr.filter(Boolean);
  }
  const html = `
    <div class="diffHTML">
      <div class="diffHTML-main">
        <div class="diffHTML-header">
            <a href="javascript:" class="ui-button ui-button-primary" id="Prev" role="button">Prev</a>
            <a href="javascript:" class="ui-button ui-button-primary" id="Next" role="button">Next</a>
            <a href="javascript:" class="ui-button ui-button-primary" id="clearAllMarks" role="button">Clear All Marks</a>
            <a href="javascript:" class="ui-button ui-button-primary" id="changeMarks" role="button">Next Mark</a>
            <input class="ui-input select-text" style="display: none" placeholder="Search...">
            <a href="javascript:" data-lan="${lan}" class="ui-button ui-button-primary" id="Save" role="button">Save</a>
            <a href="javascript:" class="ui-button ui-button-warning red_button" id="Cancel" role="button">Cancel</a>
          </div>
          <div class="diffHTML-content" id="compare">
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", html);
  const diffHTML = document.querySelector(".diffHTML");
  const Save = document.querySelector("#Save");
  const Cancel = document.querySelector("#Cancel");
  Cancel.onclick = () => {
    diffHTML.remove();
  };
  // setEditor(path, data.initC.content, data.nowC.content);
  if (!data.initC.path.endsWith(".json")) {
    setEditor(path, data.nowC.content, data.initC.content);

    Prev.onclick = () => {
      // doc.scrollToDiff("prev");
      if (diffNavigator) {
        diffNavigator.previous(); // 跳到下一个差异
      }
    };
    Next.onclick = () => {
      if (diffNavigator) {
        diffNavigator.next(); // 跳到下一个差异
      }
      // doc.scrollToDiff("next");
    };
    clearAllMarks.onclick = () => {
      if (!originalEditor) return;
      // 清空标记数组
      markedLines = {};
      // 从 localStorage 移除
      localStorage.removeItem("markedLines");

      // 用之前保存的 id 替换成空数组，真正移除
      if (originalDecorations && originalDecorations.length) {
        originalDecorations = originalEditor.deltaDecorations(
          originalDecorations,
          []
        );
        originalDecorations = []; // 清空本地缓存
      }

      // 清除 dom 中所有 .myLineHighlight 和 .myGlyphMargin
      document
        .querySelectorAll(".myLineHighlight, .myGlyphMargin")
        .forEach((el) => {
          el.classList.remove("myLineHighlight", "myGlyphMargin");
        });
    };

    let currentMarkIndex = {};

    // 点击按钮切换到下一个标记
changeMarks.onclick = () => {
  const marks = markedLines[path]; // 当前文件的标记行数组
  if (!Array.isArray(marks) || marks.length === 0) {
    console.log("当前文件没有标记行");
    return;
  }

  // 确保有记录当前索引
  if (typeof currentMarkIndex[path] !== "number") {
    currentMarkIndex[path] = 0;
  } else {
    // 递增索引并循环
    currentMarkIndex[path] = (currentMarkIndex[path] + 1) % marks.length;
  }

  const targetLine = marks[currentMarkIndex[path]];

  // 获取左侧 originalEditor
  const originalEditor = diffEditor.getOriginalEditor();

  if (originalEditor && targetLine) {
    // 跳转到对应行
    originalEditor.revealLineInCenter(targetLine);
    // 设置光标位置
    originalEditor.setPosition({ lineNumber: targetLine, column: 1 });
    // 聚焦编辑器
    originalEditor.focus();
  }
};
  } else {
    if (jsonEditor) jsonEditor.dispose();
    jsonEditor = null;
    require.config({
      paths: {
        vs: "https://unpkg.com/monaco-editor@0.34.1/min/vs",
      },
    });
    require(["vs/editor/editor.main"], function () {
      jsonEditor = monaco.editor.create(document.querySelector("#compare"), {
        value: data.nowC.content,
        language: "json",
        automaticLayout: true,
        theme: "vs-dark",
        fontSize: 16,
        fontFamily: "JetBrains Mono",
        wordWrap: "on",
        lineNumbers: true,
        lineHeight: 40,
      });
    });
  }

  Save.onclick = () => {
    const content =
      jsonEditor?.getValue?.() ||
      doc?.get?.("lhs") ||
      modifiedModel?.getValue?.();
    if (!content) {
      new LightTip().error("修改失败");
      return;
    }
    const { lan } = Save.dataset;
    Save.classList.add("loading");
    fetch("/set-file", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content,
        path: data.nowC.path,
        lan,
      }),
    })
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        if (res?.code === 200) {
          if (res?.message === "complete") {
            diffHTML.remove();
            if (curP) {
              curP.querySelector(".check-handle input").checked = true;
            }
          } else {
            new LightTip().error("修改失败");
          }
        }
        Save.classList.remove("loading");
      });
  };

  const selectText = document.querySelector(".select-text");
  if (selectText) {
    selectText.onchange = () => {
      const val = (selectText.value || "").trim();
      doc.search("rhs", val);
    };
  }
};

const handleNoData = () => {
  const contentDom = document.querySelector(".wrappper__content-content");
  const noData = `<div class="no-data"></div>`;
  contentDom.innerHTML = "";
  contentDom.insertAdjacentHTML("beforeend", noData);
  OneClick.classList.add("disabled");
};

const OneClickHandle = () => {
  const select = document.querySelector(".wrappper__sider_01 select");
  fetch("/oneclick-sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      init: select.value,
      data: dataInfo,
      data2: data2Info,
    }),
  }).then((res) => {
    return res.json();
  });
};

const handleGetFile = () => {
  handleNoData();
  handleBtn.onclick = () => {
    // if (!isWatching) {
    //   new LightTip().error("请点击开启 Watch 监听");
    //   return;
    // }
    handleBtn.classList.add("loading");
    const select = document.querySelector(".wrappper__sider_01 select");
    const checkboxes = document.querySelectorAll("[name='checkbox']:checked");
    var selectedValues = [];
    checkboxes.forEach(function (checkbox) {
      selectedValues.push(checkbox.value);
    });
    if (!selectedValues?.length) {
      handleBtn.classList.remove("loading");
      new LightTip().error("请选择需要同步的语言");
      return;
    }
    const commids = document.querySelector("#commit-ids");
    fetch("/handle-files", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        init: select.value,
        async: selectedValues,
        commitIds: commids?.value || "",
      }),
    })
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        if (res.code === 200 && res?.message === "handle-files-success") {
          if (!res?.data?.length) {
            handleNoData();
            new LightTip().error("No Modified Files");
            handleBtn.classList.remove("loading");
            return;
          }
          res?.data.forEach((item) => {
            if (isImageFile(item)) {
              imgs.push(item);
            }
          });
          const header = document.querySelector(".wrappper__content-header");
          const content = document.querySelector(".wrappper__content-content");
          header.innerHTML = "";
          content.innerHTML = "";
          selectedValues.forEach((lan, _idx) => {
            createContent(
              lan,
              res?.data,
              res?.data2,
              res?.data3,
              res?.data4,
              select.value,
              _idx
            );
          });
        } else {
          handleNoData();
          new LightTip().error(`${res?.message || "获取文件失败"}`);
        }
        handleBtn.classList.remove("loading");
      })
      .catch((err) => {
        handleBtn.classList.remove("loading");
        console.log("err", err);
      });
  };
  selectAllBtn.onclick = () => {
    isc = !isc;
    const checkboxes = document.querySelectorAll("[name='checkbox']");
    checkboxes.forEach(function (checkbox) {
      checkbox.checked = isc;
    });
  };
  arSwitchCss.onclick = () => {
    renderCssSwitchHTML();
  };
  OneClick.onclick = () => {
    OneClickHandle();
  };
  getUrlName.onclick = () => {
    getUrlNameHanle();
  };
};

let urlData2 = {};

const getUrlNameHanle = () => {
  const html = `
    <div class="getUrlName">
      <div class="getUrlName_header">
        <input type="text" placeholder="请输入 URL, 如 https://www.vidnoz.com/talking-head.html" class="getUrlName-input">
        <a href="javascript:" class="getUrlName-btn ui-button ui-button-primary" role="button">GET URL</a>
        <div class="getUrlName-progress">
          <div class="getUrlName-number">0</div>
          <div class="getUrlName-copy">COPY</div>
        </div>
      </div>
      <div class="getUrlName-textarea"></div>
      <div class="iframe-cover-close"><svg t="1732002642334" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="6223" width="256" height="256"><path d="M887.2 774.2L624.8 510.8l263-260c10.8-10.8 10.8-28.4 0-39.2l-74.8-75.2c-5.2-5.2-12.2-8-19.6-8-7.4 0-14.4 3-19.6 8L512 395.6 249.8 136.6c-5.2-5.2-12.2-8-19.6-8-7.4 0-14.4 3-19.6 8L136 211.8c-10.8 10.8-10.8 28.4 0 39.2l263 260L136.8 774.2c-5.2 5.2-8.2 12.2-8.2 19.6 0 7.4 2.8 14.4 8.2 19.6l74.8 75.2c5.4 5.4 12.4 8.2 19.6 8.2 7 0 14.2-2.6 19.6-8.2L512 626.2l261.4 262.2c5.4 5.4 12.4 8.2 19.6 8.2 7 0 14.2-2.6 19.6-8.2l74.8-75.2c5.2-5.2 8.2-12.2 8.2-19.6-0.2-7.2-3.2-14.2-8.4-19.4z" p-id="6224" fill="#ffffff"></path></svg></div>
      <div class="getUrlName-popup"></div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", html);
  const getUrlName = document.querySelector(".getUrlName");
  const closeBtn = getUrlName.querySelector(".iframe-cover-close");
  const getBtn = getUrlName.querySelector(".getUrlName-btn");
  const input = getUrlName.querySelector(".getUrlName-input");
  const textarea = getUrlName.querySelector(".getUrlName-textarea");
  const number = getUrlName.querySelector(".getUrlName-number");
  const copyBtn = getUrlName.querySelector(".getUrlName-copy");
  const popup = getUrlName.querySelector(".getUrlName-popup");
  closeBtn.onclick = () => {
    getUrlName.remove();
  };
  copyBtn.onclick = () => {
    const ps = document.querySelectorAll(".getUrlName-textarea p");
    if (!ps?.length) {
      new LightTip().error("No Data To Copy");
      return;
    }
    let str = "";
    ps.forEach((item) => {
      str += `${item.querySelector("span").textContent}\n`;
    });
    navigator.clipboard.writeText(str);
    new LightTip().success("Copy Successfull!");
  };
  getBtn.onclick = () => {
    if (!input?.value) {
      new LightTip().error("请输入 URL ");
      return;
    }
    textarea.innerHTML = "";
    number.innerHTML = "0";
    urlData2 = {};
    popup.innerHTML = "";
    getBtn.classList.add("loading");
    fetch("/get-urls", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: input.value,
      }),
    })
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        textarea.innerHTML = "";
        number.innerHTML = "0";
        urlData2 = {};
        if (res?.code === 200 && res?.message === "get-urls-success") {
          const ress = res?.data || {};
          const ress2 = res?.data2 || {};
          urlData2 = ress2;
          const keysA = Object.keys(ress);
          keysA.forEach((key) => {
            const p = document.createElement("p");
            const button = document.createElement("a");
            button.href = `javascript:;`;
            button.className = "ui-button ui-button-primary get-Sync-btn";
            button.textContent = "Get Path";
            p.innerHTML = `<span>${key}: https://${key}-test.vidnoz.com/${ress[key]}</span>`;
            p.appendChild(button);
            textarea.appendChild(p);
            button.onclick = () => {
              document
                .querySelectorAll(".get-Sync-btn")
                .forEach((item) => item.parentNode.classList.remove("active"));
              button.parentNode.classList.add("active");
              popup.innerHTML = "";
              let toTestData = [`${ress[key]}`];
              console.log("toTestData", toTestData);
              let html = `<ul><li data-text="${`${ress[key]}`}">${`${ress[key]}`} <span class="removeToTestFile">×</span></li>`;
              let lanData = urlData2[key];
              for (const key1 in lanData) {
                const resourses = lanData[key1];
                for (let i = 0; i < resourses.length; i++) {
                  const resourse = resourses[i];
                  html += `<li data-text="${resourse}">${resourse} <span class="removeToTestFile">×</span></li>`;
                  toTestData.push(resourse);
                }
              }
              html += `</ul><a href="javascript:;" class="ui-button ui-button-primary to-test">To Test</a>`;
              popup.insertAdjacentHTML("beforeend", html);
              const toTest = popup.querySelector(".to-test");
              const removeToTestFiles =
                document.querySelectorAll(".removeToTestFile");
              removeToTestFiles.forEach((removeToTestFile) => {
                removeToTestFile.onclick = (e) => {
                  e.stopPropagation();
                  const parentNodeText =
                    removeToTestFile.parentNode.dataset.text.trim();
                  for (var i = 0; i < toTestData.length; i++) {
                    if ((toTestData[i] || "").trim() === parentNodeText) {
                      toTestData.splice(i, 1);
                      break;
                    }
                  }
                  removeToTestFile.parentNode.remove();
                  console.log("toTestData", toTestData);
                };
              });
              toTest.onclick = () => {
                toTest.classList.add("loading");
                fetch("/ftp/upload-ftp", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    env: "test",
                    data: {
                      [key]: toTestData,
                    },
                  }),
                })
                  .then((res) => {
                    return res.json();
                  })
                  .then((res) => {
                    // if (res?.code === 200 && res?.message === "ftp-upload-success") {
                    //   new LightTip().success(`${getEnv} 上传 ftp 成功`);
                    // } else {
                    //   new LightTip().error(`${getEnv} 上传 ftp 失败`);
                    // }
                    // upload.classList.remove("loading");
                  });
              };
            };
          });
          if (!keysA.length) {
            new LightTip().error(`No Data`);
          }
          number.innerHTML = keysA.length;
        } else {
          new LightTip().error(`${res?.data || "获取失败"} `);
        }
        getBtn.classList.remove("loading");
      });
  };
};

const renderCssSwitchHTML = () => {
  const html = `
    <div class="css-arcss">
      <div class="css-arcss-header">
        <a href="javascript:" class="ui-button ui-button-primary Switch-css" role="button">Switch</a>
        <a href="javascript:" class="ui-button ui-button-primary copy-code" role="button" style="display:none">Copy</a>
        <a href="javascript:" class="ui-button ui-button-warning red_button Cancel-switch" role="button">Cancel</a>
      </div>
      <div class="css-arcss-content">
        <div class="css-arcss-content_left">
          <textarea id="origin-css"></textarea>
        </div>
        <div class="css-arcss-content_content">
          <textarea id="after-css" readonly></textarea>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", html);
  const cssArcss = document.querySelector(".css-arcss");
  const SwitcCss = document.querySelector(".Switch-css");
  const copyCode = document.querySelector(".copy-code");
  const CancelSwitch = document.querySelector(".Cancel-switch");
  const afterCss = document.querySelector("#after-css");
  const textareaCode = document.querySelector("#origin-css");
  copyCode.onclick = () => {
    navigator.clipboard
      .writeText(afterCss.value.trim())
      .then(() => {
        new LightTip().success("Copy Success!");
      })
      .catch((err) => {
        new LightTip().error("Copy Failed!");
      });
  };
  textareaCode.oninput = () => {
    copyCode.style.display = "none";
  };
  CancelSwitch.onclick = () => {
    cssArcss.remove();
  };
  SwitcCss.onclick = () => {
    if (!textareaCode.value.trim()) {
      new LightTip().error("请输入 Scss 或 Css 代码");
      return;
    }
    SwitcCss.classList.add("loading");
    fetch("/switch-css-ar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        csscode: textareaCode.value.trim(),
      }),
    })
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        if (res?.message === "switch-code-success") {
          afterCss.innerHTML = res?.data;
          copyCode.style.display = "flex";
        } else {
          new LightTip().error(res?.data);
        }
        SwitcCss.classList.remove("loading");
      })
      .catch((err) => {
        SwitcCss.classList.remove("loading");
      });
  };
};

const selectOnChange = () => {
  const select = document.querySelector(".wrappper__sider_01 select");
  const checkboxes = document.querySelectorAll("[name='checkbox']");
  select.addEventListener("change", function () {
    const selectedValue = select.value;
    selectLan = selectedValue;
    const header = document.querySelector(".wrappper__content-header");
    const content = document.querySelector(".wrappper__content-content");
    header.innerHTML = "";
    content.innerHTML = "";
    data2Info = {};
    dataInfo = {};
    handleNoData();
    const checkboxes = document.querySelectorAll("input[name='checkbox']");
    checkboxes.forEach(function (checkbox) {
      checkbox.checked = false;
      isc = false;
    });
  });
  checkboxes.forEach((item) => {
    item.onchange = () => {
      const header = document.querySelector(".wrappper__content-header");
      const content = document.querySelector(".wrappper__content-content");
      header.innerHTML = "";
      content.innerHTML = "";
      data2Info = {};
      dataInfo = {};
      handleNoData();
    };
  });
};

function logOut() {
  const lo = document.querySelector(".log-out");
  lo.onclick = () => {
    fetch("/log-out").then((res) => {
      window.location.href = "/login";
    });
  };
}

allPublish.onclick = () => {
  allPublish.classList.add("loading");
  const checkboxes = document.querySelectorAll("[name='checkbox']:checked");
  var selectedValues = [];
  checkboxes.forEach(function (checkbox) {
    selectedValues.push(checkbox.value);
  });
  fetch("/all-publish", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      lans: selectedValues,
    }),
  }).then((res) => {
    return res.json();
  });
};

allDiscard.onclick = () => {
  if (isWatching) {
    new LightTip().error("请先关闭 Watching，其他操作需要开启");
    return;
  }
  allDiscard.classList.add("loading");
  const checkboxes = document.querySelectorAll("[name='checkbox']:checked");
  var selectedValues = [];
  checkboxes.forEach(function (checkbox) {
    selectedValues.push(checkbox.value);
  });
  fetch("/all-discard", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      lans: selectedValues,
    }),
  }).then((res) => {
    return res.json();
  });
};

allPull.onclick = () => {
  if (isWatching) {
    new LightTip().error("请先关闭 Watching，其他操作需要开启");
    return;
  }
  allPull.classList.add("loading");
  const checkboxes = document.querySelectorAll("[name='checkbox']:checked");
  var selectedValues = [];
  checkboxes.forEach(function (checkbox) {
    selectedValues.push(checkbox.value);
  });
  fetch("/all-pull", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      lans: selectedValues,
    }),
  });
};

allPush.onclick = () => {
  if (isWatching) {
    new LightTip().error("请先关闭 Watching，其他操作需要开启");
    return;
  }
  const checkboxes = document.querySelectorAll("[name='checkbox']:checked");
  var selectedValues = [];
  checkboxes.forEach(function (checkbox) {
    selectedValues.push(checkbox.value);
  });
  if (!selectedValues?.length) {
    new LightTip().error("请选择需要 Push 的语言");
    return;
  }
  setAllCommitOrPush(allPush, selectedValues);
};

const setAllCommitOrPush = (item, selectedValues = []) => {
  const html = `
    <div class="setCommit">
      <div class="setCommit_left">
        <div class="set-commit-comtent">
          <select name="commit__style">
            <option class="feat" title="新功能 feature">feat</option>
            <option class="fix" title="修复 bug">fix</option>
            <option class="docs" title="文档注释">docs</option>
            <option class="style" title="代码格式(不影响代码运行的变动)">style</option>
            <option class="refactor" title="重构、优化(既不增加新功能，也不是修复bug)">refactor</option>
            <option class="perf" title="性能优化">perf</option>
            <option class="test" title="增加测试">test</option>
            <option class="chore" title="构建过程或辅助工具的变动">chore</option>
            <option class="revert" title="回退">revert</option>
            <option class="build" title="打包">build</option>
          </select>
          <input class="ui-input commit-input" placeholder="输入 commit 内容">
        </div>
      </div>
      <div class="setCommit_btns">
        <a href="javascript:" class="ui-button ui-button-primary" role="button">Send</a>
        <a href="javascript:" class="ui-button ui-button-warning red_button" role="button">Cancel</a>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", html);
  const setCommit = document.querySelector(".setCommit");
  const saveBtn = document.querySelector(".setCommit .ui-button-primary");
  const cancelBtn = document.querySelector(".setCommit .ui-button-warning");
  const select = document.querySelector('[name="commit__style"]');
  const input = setCommit.querySelector(".commit-input");
  function removeLoading(str = "", bool = false) {
    if (bool) {
      new LightTip().success(str);
    } else {
      new LightTip().error(str);
    }
    saveBtn.classList.remove("loading");
    cancelBtn.classList.remove("disabled");
  }
  saveBtn.onclick = async () => {
    if (!input.value) {
      removeLoading("必须填写 commit 内容");
      return;
    }
    saveBtn.classList.add("loading");
    cancelBtn.classList.add("disabled");
    const content = `${select.value}:${input.value}`;
    fetch("/all-push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lans: selectedValues,
        commit: content,
      }),
    });
  };
  cancelBtn.onclick = () => {
    item.classList.remove("loading");
    setCommit.remove();
  };
};

const iframeCover = (src = "") => {
  const html = `
    <div class="iframe-cover">
        <iframe
          src=${src}
          frameborder="0"
          scrolling="no"
          width="100%"
          height="100%">
        </iframe>
        <div class="iframe-cover-close"><svg t="1732002642334" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="6223" width="256" height="256"><path d="M887.2 774.2L624.8 510.8l263-260c10.8-10.8 10.8-28.4 0-39.2l-74.8-75.2c-5.2-5.2-12.2-8-19.6-8-7.4 0-14.4 3-19.6 8L512 395.6 249.8 136.6c-5.2-5.2-12.2-8-19.6-8-7.4 0-14.4 3-19.6 8L136 211.8c-10.8 10.8-10.8 28.4 0 39.2l263 260L136.8 774.2c-5.2 5.2-8.2 12.2-8.2 19.6 0 7.4 2.8 14.4 8.2 19.6l74.8 75.2c5.4 5.4 12.4 8.2 19.6 8.2 7 0 14.2-2.6 19.6-8.2L512 626.2l261.4 262.2c5.4 5.4 12.4 8.2 19.6 8.2 7 0 14.2-2.6 19.6-8.2l74.8-75.2c5.2-5.2 8.2-12.2 8.2-19.6-0.2-7.2-3.2-14.2-8.4-19.4z" p-id="6224" fill="#ffffff"></path></svg></div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", html);
  const close = document.querySelector(".iframe-cover-close");
  close.onclick = () => {
    const iframeCover = document.querySelector(".iframe-cover");
    iframeCover.remove();
  };
};

window.addEventListener("load", () => {
  watchBtnListen();
  handleSocket();
  handleGetFile();
  selectOnChange();
  logOut();
});

// 将此代码放在您的 index.js 文件中的适当位置
document.addEventListener("DOMContentLoaded", function () {
  // 优化全选按钮
  const selectAllBtn = document.querySelector(".select-all-btn");
  const checkboxes = document.querySelectorAll('input[name="checkbox"]');
  let allSelected = false;

  // 使用事件委托而不是为每个复选框添加事件监听器
  selectAllBtn.addEventListener("click", function (e) {
    e.preventDefault();
    allSelected = !allSelected;

    // 批量更改复选框状态而不是逐个设置
    checkboxes.forEach((checkbox) => {
      checkbox.checked = allSelected;
    });

    // 更新按钮状态
    this.textContent = allSelected ? "NONE" : "ALL";
    this.style.background = allSelected
      ? "linear-gradient(135deg, #ff4b4b, #ff0000)"
      : "linear-gradient(135deg, #2486ff, #1a76f2, #2486ff)";
  });
});
