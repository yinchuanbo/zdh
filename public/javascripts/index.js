const socket = io("http://localhost:4000");
let imgs = [];
let isWatching = false;

let editor = null,
  jsonEditor = null, isc = false;

const watchBtn = document.querySelector(".watch-btn");
const arSwitchCss = document.querySelector(".ar-switch-css");
const selectAllBtn = document.querySelector(".select-all-btn");
const handleBtn = document.querySelector(".handle-btn");
const allPublish = document.querySelector(".all-publish");
const allPull = document.querySelector(".all-pull");

let selectLan = document.querySelector(".wrappper__sider_01 select").value;

let isFirst = false;

let curP = null;

let data2Info = {};

function openFullScreenWindow(url) {
  const isWeb = navigator.userAgent.includes("Electron");
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
}

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
  data2Info = data2;
  const header = document.querySelector(".wrappper__content-header");
  const content = document.querySelector(".wrappper__content-content");
  const curDatas2 = data2[lan];

  let isIdx = _idx === 0;

  const html01 = `<div class="header-item ${isIdx ? 'active' : ''}">${lan}<span title="${data3[lan]}">${data3[lan]}</span><div>`;
  const html02 = `<div class="content-item ${isIdx ? 'active' : ''}">
    <div class="content-item-btns">
      <a href="javascript:" class="ui-button ui-button-primary pull-code" title="Pull Code" role="button" data-lan="${lan}"><svg t="1729842156712" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="12812" width="30" height="30"><path d="M512 64C759.04 64 960 264.96 960 512S759.04 960 512 960s-448-200.96-448-448S264.96 64 512 64zM512 896.00000001C723.744 896 896 723.744 896.00000001 512c0-211.74400001-172.256-384.00000001-384.00000001-384.00000001-211.74400001 0-384.00000001 172.256-384.00000001 384.00000001C128 723.744 300.256 896 512 896.00000001z" p-id="12813" fill="#ffffff"></path><path d="M329.536 565.632l158.496 160.256c9.344 9.472 23.168 11.84 34.784 7.136 0.736-0.288 1.312-0.992 2.01600001-1.344 2.976-1.472 5.952-3.072 8.44799998-5.536 0.032-0.032 0.032-0.064 0.06400001-0.096s0.064-0.032 0.09599999-0.064l159.36000001-158.912c12.51200001-12.48 12.544-32.736 0.064-45.248-6.24-6.272-14.464-9.408-22.656-9.408-8.15999999 0-16.352 3.10399999-22.592 9.344L544 625.056 544 320c0-17.696-14.336-32-32-32.00000001s-32 14.304-32 32.00000001l0 306.752-104.96-106.112c-6.24-6.336-14.496-9.504-22.752-9.504-8.128 0-16.256 3.072-22.496 9.248C317.216 532.8 317.088 553.056 329.536 565.632z" p-id="12814" fill="#ffffff"></path></svg></a>
      <a href="javascript:" class="ui-button ui-button-primary discard-code" title="Discard Code" role="button" data-lan="${lan}" style="display: ${selectLan === lan ? "none" : ""}"><svg t="1729820332473" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5389" width="30" height="30"><path d="M224 128v224L256 384h224V320H318.656l60.224-60.224a227.328 227.328 0 1 1 321.472 321.472L367.744 913.92l46.08 46.08 332.672-332.672A292.48 292.48 0 0 0 332.8 213.696l-44.8 44.8V128h-64z" fill="#ffffff" p-id="5390"></path></svg></a>
      <a href="javascript:" class="ui-button ui-button-primary commit-code" role="button" data-lan="${lan}" style="display: none">Commit</a>
      <a href="javascript:" class="ui-button ui-button-primary merge-code" role="button" title="Merge" data-lan="${lan}"><svg t="1729820377101" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="6462" width="30" height="30"><path d="M768 448c-47.274 0-88.614 25.78-110.782 64L638 512c-84.928 0-159.98-35.808-223.07-106.428-40.712-45.574-66.986-97.738-75.712-116.436C366.602 265.644 384 230.826 384 192c0-70.58-57.42-128-128-128S128 121.42 128 192c0 47.274 25.78 88.614 64 110.782l0 418.438C153.78 743.386 128 784.726 128 832c0 70.58 57.42 128 128 128s128-57.42 128-128c0-47.274-25.78-88.614-64-110.782L320 491.384C407.106 588.614 516.936 640 638 640l19.218 0c22.168 38.22 63.508 64 110.782 64 70.58 0 128-57.42 128-128S838.58 448 768 448zM256 128c35.346 0 64 28.654 64 64s-28.654 64-64 64-64-28.654-64-64S220.654 128 256 128zM256 896c-35.346 0-64-28.654-64-64s28.654-64 64-64 64 28.654 64 64S291.346 896 256 896zM768 640c-35.346 0-64-28.654-64-64s28.654-64 64-64 64 28.654 64 64S803.346 640 768 640z" p-id="6463" fill="#ffffff"></path></svg></a>
      <a href="javascript:" class="ui-button ui-button-primary push-code" role="button" title="Commit + Push" data-lan="${lan}"><svg t="1729842032932" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="8172" width="30" height="30"><path d="M725.333333 512a213.333333 213.333333 0 0 1-170.666666 209.066667V896h-85.333334v-174.933333a213.333333 213.333333 0 0 1 0-418.133334V128h85.333334v174.933333a213.333333 213.333333 0 0 1 170.666666 209.066667m-213.333333-128a128 128 0 0 0-128 128 128 128 0 0 0 128 128 128 128 0 0 0 128-128 128 128 0 0 0-128-128z" fill="#ffffff" p-id="8173"></path></svg> + <svg t="1729842168039" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="13067" width="30" height="30"><path d="M64 512a448 448 0 1 1 448 448 448.512 448.512 0 0 1-448-448z m64 0a384 384 0 1 0 384-384 384.512 384.512 0 0 0-384 384z m352 192V398.976L376.384 502.208a32 32 0 0 1-45.184-45.248l159.36-158.912a30.656 30.656 0 0 1 8.64-5.696c0.704-0.32 1.28-1.024 2.048-1.344a32 32 0 0 1 34.816 7.104l158.528 160a32 32 0 1 1-45.504 44.8L544 397.248V704a32 32 0 1 1-64 0z" p-id="13068" fill="#ffffff"></path></svg></a>
      <a href="javascript:" class="ui-button ui-button-primary dey-to-test" role="button" data-lan="${lan}" style="display: none">上传至 ${lan} Test Ftp</a>
      <a href="javascript:" class="ui-button ui-button-primary dey-to-pro" role="button" data-lan="${lan}" style="display: none">上传至 ${lan} Pro Ftp</a>
      <a href="javascript:" class="ui-button ui-button-primary all-img" style="display: ${selectLan === lan ? "none" : ""}" title="Resource Async" role="button" data-lan="${lan}"><svg t="1729820839670" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="19174" width="30" height="30"><path d="M636.330667 133.717333c99.072 9.898667 178.773333 69.674667 195.669333 172.117334h-57.344l92.672 137.984L960 305.834667h-63.914667c-17.066667-137.984-121.429333-227.626667-253.226666-240.426667-18.218667-1.408-35.157333 14.208-35.157334 34.133333 1.194667 17.066667 12.885333 32.725333 28.586667 34.133334zM450.133333 64H127.914667c-18.261333 0-32.554667 15.616-32.554667 35.584v307.2c0 19.968 14.293333 35.584 32.554667 35.584h322.261333c18.218667 0 32.554667-15.616 32.554667-35.584v-307.2c0-19.968-14.336-35.584-32.554667-35.584z m-31.36 310.101333H159.274667V132.266667H418.986667l-0.128 241.834666zM387.413333 888.96c-110.933333-9.898667-195.712-83.882667-199.68-206.250667h61.312l-92.416-137.813333L64 682.666667h61.312c2.474667 157.909333 113.408 260.352 255.701333 274.56 18.218667 1.408 35.157333-14.208 35.157334-34.133334a33.877333 33.877333 0 0 0-28.714667-34.133333z m509.824-308.650667h-322.261333c-18.346667 0-32.554667 15.786667-32.554667 35.584v308.650667c0 19.84 14.293333 35.413333 32.554667 35.413333h322.261333c18.218667 0 32.554667-15.573333 32.554667-35.413333v-308.650667c0-19.84-15.616-35.584-32.554667-35.584z m-31.402666 310.101334H606.293333v-240.384h259.626667v240.384z" p-id="19175" fill="#ffffff"></path></svg></a>
      <a href="javascript:" class="ui-button ui-button-primary publish" title="Publish" role="button" data-lan="${lan}"><svg t="1729820784129" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="18059" width="30" height="30"><path d="M939.52 22.752L28.448 392.256l173.792 164.416 53.76-55.456-86.464-81.92L783.648 170.112 173.504 750.368h-1.984V1024h76.224v-237.792l115.488-109.504 55.744-53.184L937.248 131.136l-86.752 89.6-94.432 319.712L655.648 879.232l-118.912-112.64-53.76 55.456 210.496 199.104 224.416-759.168L995.552 0l-56.032 22.752z" p-id="18060" fill="#ffffff"></path></svg></a>
      <a href="javascript:" class="ui-button ui-button-primary vs-code" title="Vs Code" role="button" data-lan="${lan}"><svg t="1729820704088" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="14901" width="30" height="30"><path d="M927.5 161.4L786.9 93.8l-43.5-20.9c-5.4-2.6-11-4.2-16.7-5h-0.2c-0.6-0.1-1.2-0.2-1.8-0.2-16.3-1.6-32.9 4-44.9 16.1 0.8-0.8 1.7-1.6 2.6-2.3-0.8 0.7-1.7 1.5-2.5 2.3L327.3 405.1 173.7 288.7c-14.3-10.9-34.4-10-47.7 2.1l-49.2 44.7c-0.9 0.8-1.7 1.6-2.5 2.5-13.8 15.2-12.7 38.8 2.6 52.6L210.1 512 76.9 633.4c-15.2 13.8-16.4 37.4-2.6 52.6 0.8 0.9 1.6 1.7 2.5 2.5l49.2 44.7c13.3 12.1 33.3 13 47.6 2.1l153.6-116.5 352.7 321.6c16.7 16.7 42.2 21.1 63.5 10.8l184.2-88.5c19.4-9.3 31.7-28.9 31.7-50.3V211.7c0-21.5-12.4-41.1-31.8-50.3zM468.1 512l267.5-202.9v405.8L468.1 512z" fill="#ffffff" p-id="14902"></path></svg></a>
      <a href="javascript:" class="ui-button ui-button-primary open-site" title="Copy Website URL" role="button" data-lan="${lan}"><svg t="1729820741115" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="16916" width="30" height="30"><path d="M536.704 162.944a229.312 229.312 0 0 1 324.352 324.352L755.84 595.2a42.688 42.688 0 0 1-61.056-59.584l105.728-108.416a144 144 0 1 0-203.648-203.648l-0.384 0.384-108.032 105.344a42.688 42.688 0 0 1-59.52-61.056l107.776-105.216zM702.08 321.92c16.64 16.64 16.64 43.648 0 60.288l-320 320a42.688 42.688 0 0 1-60.288-60.352l320-320c16.64-16.64 43.648-16.64 60.288 0z m-373.696 106.24c16.896 16.512 17.28 43.52 0.768 60.352L223.488 596.864a144 144 0 1 0 203.648 203.648l0.384-0.384 108.032-105.344a42.688 42.688 0 1 1 59.52 61.056l-107.776 105.152a229.312 229.312 0 0 1-324.288-324.288L268.16 428.8a42.688 42.688 0 0 1 60.288-0.768z" fill="#ffffff" p-id="16917"></path></svg></a>
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
           <a href="javascript:" class="ui-button ui-button-warning async-res" style="display: ${selectLan === lan ? "none" : ""}" role="button">${info.startsWith("img/") ? "ASYNC" : "DIFF"}</a>
           <a href="javascript:" class="ui-button ui-button-primary one-deploy" role="button" title="Deylop To Test Env" style="display: ${info.endsWith(".json") ? "none" : ""}">TEST</a>
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
  const vsCodes = document.querySelectorAll(".vs-code");
  const openSite = document.querySelectorAll(".open-site");

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
            new LightTip().success("图片批量同步成功");
            const elements = document.querySelectorAll(
              `li[data-lan="${lan}"][data-path^="img/"]`
            );
            if (elements?.length) {
              elements.forEach((item) => {
                item.querySelector(".check-handle input").checked = true;
              });
            }
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
      console.log("push", item);
      if (isWatching) {
        new LightTip().error("请先关闭 Watching，其他操作需要开启");
        return;
      }
      item.classList.add("loading");
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
      item.classList.add("loading");
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
};

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
          <select name="commit__style"  ${hasCommit ? `disabled` : ""}>
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

let originalModel, modifiedModel, diffEditor, diffNavigator;

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
      vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.1/min/vs",
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
        formatOnPaste: true,
        glyphMargin: true,
        selectOnLineNumbers: true,
      }
    );

    diffEditor.setModel({
      original: originalModel,
      modified: modifiedModel,
    });
    // diffEditor.updateOptions({
    //   renderSideBySide: false
    // })
    // 创建差异导航器
    diffNavigator = monaco.editor.createDiffNavigator(diffEditor, {
      followsCaret: true, // 跟随光标
      ignoreCharChanges: true, // 只关注行级别的变化
      alwaysRevealFirst: true, // 初次打开时自动跳到第一个差异
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
      <div class="diffHTML-header">
        <a href="javascript:" class="ui-button ui-button-primary" id="Prev" role="button">Prev</a>
        <a href="javascript:" class="ui-button ui-button-primary" id="Next" role="button">Next</a>
        <input class="ui-input select-text" style="display: none" placeholder="Search...">
        <a href="javascript:" data-lan="${lan}" class="ui-button ui-button-primary" id="Save" role="button">Save</a>
        <a href="javascript:" class="ui-button ui-button-warning red_button" id="Cancel" role="button">Cancel</a>
      </div>
      <div class="diffHTML-content" id="compare">
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
    // const selectLines = document.querySelector(".select-lines");
    // selectLines.onchange = () => {
    //   const line = selectLines.value || 0;
    //   const a = diffEditor.getOriginalEditor()
    //   a.setPosition({ lineNumber: Number(line), column: 1 });
    //   a.revealLine(Number(line))
    // }
    // doc = new Mergely("#compare", {
    //   sidebar: true,
    //   ignorews: false,
    //   license: "lgpl-separate-notice",
    //   lhs: data.nowC.content,
    //   rhs: data.initC.content,
    //   bgcolor: "#3c3c3c",
    //   cmsettings: {
    //     readOnly: false,
    //   },
    // });
    // doc.once("updated", () => {
    //   doc.once("updated", () => {
    //     doc.scrollToDiff("next");
    //   });
    // });
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
  } else {
    if (jsonEditor) jsonEditor.dispose();
    jsonEditor = null;
    require.config({
      paths: {
        vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.1/min/vs",
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
            if (item.startsWith("img/")) {
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
  }
  arSwitchCss.onclick = () => {
    renderCssSwitchHTML()
  }
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
  document.body.insertAdjacentHTML("beforeend", html)
  const cssArcss = document.querySelector(".css-arcss")
  const SwitcCss = document.querySelector(".Switch-css")
  const copyCode = document.querySelector(".copy-code")
  const CancelSwitch = document.querySelector(".Cancel-switch")
  const afterCss = document.querySelector("#after-css")
  const textareaCode = document.querySelector("#origin-css")
  copyCode.onclick = () => {
    navigator.clipboard.writeText(afterCss.value.trim())
      .then(() => {
        new LightTip().success("Copy Success!");
      })
      .catch(err => {
        new LightTip().error("Copy Failed!");
      });
  }
  textareaCode.oninput = () => {
    copyCode.style.display = "none"
  }
  CancelSwitch.onclick = () => {
    cssArcss.remove()
  }
  SwitcCss.onclick = () => {
    if (!textareaCode.value.trim()) {
      new LightTip().error("请输入 Scss 或 Css 代码");
      return;
    }
    SwitcCss.classList.add("loading")
    fetch("/switch-css-ar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        csscode: textareaCode.value.trim()
      }),
    })
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        if (res?.message === 'switch-code-success') {
          afterCss.innerHTML = res?.data
          copyCode.style.display = "block"
        } else {
          new LightTip().error(res?.data);
        }
        SwitcCss.classList.remove("loading");
      })
      .catch((err) => {
        SwitcCss.classList.remove("loading");
      });
  }
}

const selectOnChange = () => {
  const select = document.querySelector(".wrappper__sider_01 select");
  select.addEventListener("change", function () {
    const selectedValue = select.value;
    selectLan = selectedValue;
    const header = document.querySelector(".wrappper__content-header");
    const content = document.querySelector(".wrappper__content-content");
    header.innerHTML = "";
    content.innerHTML = "";
    handleNoData();
    // const divLanActive = document.querySelector(".div-lan.disabled");
    // if (divLanActive) divLanActive.classList.remove("disabled");
    // const divLan = document.querySelector(`.div-${selectedValue}`);
    // if (divLan) divLan.classList.add("disabled");
    const checkboxes = document.querySelectorAll("input[name='checkbox']");
    checkboxes.forEach(function (checkbox) {
      checkbox.checked = false;
      isc = false
    });
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
        <div class="iframe-cover-close">x</div>
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
