const socket = io();
let imgs = [];
let isWatching = false;

let editor = null;

const watchBtn = document.querySelector(".watch-btn");
const handleBtn = document.querySelector(".handle-btn");

let selectLan = document.querySelector(".wrappper__sider_01 select").value;

let isFirst = false;

let curP = null;

let data2Info = {};

const setWatch = () => {
  fetch("/watching?bool=" + isWatching)
    .then((res) => {
      console.log("res", res);
    })
    .catch((err) => {
      console.log("err", err);
    });
};

const watchBtnListen = () => {
  watchBtn.onclick = () => {
    isWatching = !isWatching;
    if (isWatching) {
      watchBtn.innerHTML = "Watching...";
    } else {
      watchBtn.innerHTML = "Watch";
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
      isWatching = !isWatching;
      if (isWatching) {
        watchBtn.innerHTML = "Watching...";
      } else {
        watchBtn.innerHTML = "Watch";
      }
      new Dialog({
        title: "Error Info",
        content: message + "-" + file,
      });
    } else if (type === "publish success") {
      new LightTip().success("publish 成功");
    } else if (type === "publish error") {
      new LightTip().error("publish 失败");
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

const createContent = (lan = "en", data = [], data2 = {}, initLan = "en") => {
  data2Info = data2;
  const header = document.querySelector(".wrappper__content-header");
  const content = document.querySelector(".wrappper__content-content");

  const curDatas2 = data2[lan];

  const html01 = `<div class="header-item active">${lan.toUpperCase()}<div>`;
  const html02 = `<div class="content-item active">
    <div class="content-item-btns">
      <a href="javascript:" class="ui-button ui-button-primary publish" role="button" data-lan="${lan}">Publish</a>
      <a href="javascript:" class="ui-button ui-button-primary pull-code" role="button" data-lan="${lan}">Pull Rebase</a>
      <a href="javascript:" class="ui-button ui-button-primary push-code" role="button" data-lan="${lan}">Push</a>
      <a href="javascript:" class="ui-button ui-button-primary dey-to-test" role="button" data-lan="${lan}" style="display: none">上传至 ${lan} Test Ftp</a>
      <a href="javascript:" class="ui-button ui-button-primary dey-to-pro" role="button" data-lan="${lan}" style="display: none">上传至 ${lan} Pro Ftp</a>
      <a href="javascript:" class="ui-button ui-button-primary all-img" style="display: ${selectLan === lan ? "none" : ""}" role="button" data-lan="${lan}">资源批处理</a>
    </div>
    <ul>
      ${data
        .map((info) => {
          const str = generateRandomString(20);
          let lujing = curDatas2?.[info] || "unknown";
          if (selectLan === lan) lujing = info;
          return `<li data-path="${info}" data-path2="${lujing}" data-lan="${lan}">
          <div class="check-handle" title="已完成可选中">
            <input type="checkbox" id="${str}" name="${str}">
            <label for="${str}" class="ui-checkbox"></label>
          </div>
        [${initLan}] ${info}&nbsp;->&nbsp;<p class="tpl__ele" contentEditable="${info.endsWith(".tpl") && selectLan !== lan ? true : false}">[${lan}] ${lujing}</p>
            <a href="javascript:" class="ui-button ui-button-primary async-res" style="display: ${selectLan === lan ? "none" : ""}" role="button">同步</a>
            <a href="javascript:" class="ui-button ui-button-primary one-deploy" role="button" style="display: ${info.endsWith(".json") ? "none" : ""}">单文件传测试</a>
          </li>`;
        })
        .join("")}
    </ul>
  </div>`;

  let active01 = document.querySelector(".header-item.active");
  let active02 = document.querySelector(".content-item.active");

  if (active01) active01.classList.remove("active");
  if (active02) active02.classList.remove("active");

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

  tplEles.forEach((item) => {
    item.addEventListener("input", function () {
      item.innerText = item.innerText;
      let path = item.innerText.split("]")[1] || "";
      path = path.trim();
      const p = item.parentNode;
      p.setAttribute("data-path2", path);
    });
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
      item.classList.add("loading");
      const p = item.parentNode;
      curP = p;
      const { path, lan, path2 } = p.dataset;
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
            diffHTML(res.data, lan, path);
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
            new LightTip().success(`${lan} 部署到 test 成功`);
          } else {
            new LightTip().success(`${lan} 部署到 test 失败`);
          }
        });
    };
  });

  allImg.forEach((item) => {
    item.onclick = () => {
      const { lan } = item.dataset;
      if (!imgs?.length) {
        new LightTip().error("此次未涉及到图片修改");
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
            new LightTip().error(lan + " Publish 失败");
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
      const { path2 } = item.parentNode.dataset;
      const urlPath = path2.includes("tpl/") ? convertTplToHtml(path2) : path2;
      console.log("urlPath", urlPath);
      const lan = item.parentNode.dataset.lan;
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
            new LightTip().success(`${urlPath} 部署到 test 成功`);
          } else {
            new LightTip().error(`${urlPath} 部署到 test 失败`);
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

  pushCodes.forEach((item) => {
    item.onclick = () => {
      if (isWatching) {
        new LightTip().error("请先关闭 Watching，其他操作需要开启");
        return;
      }
      item.classList.add("loading");
      const { lan } = item.dataset;
      setCommit(item, lan);
    };
  });
};

const setCommit = (item, lan) => {
  const html = `
    <div class="setCommit">
      <div class="setCommit_left">
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
        <input class="ui-input" placeholder="输入 commit 内容">
      </div>
      <div class="setCommit_btns">
        <a href="javascript:" class="ui-button ui-button-primary" role="button">Send</a>
        <a href="javascript:" class="ui-button ui-button-warning" role="button">Cancel</a>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", html);
  const setCommit = document.querySelector(".setCommit");
  const saveBtn = document.querySelector(".setCommit .ui-button-primary");
  const cancelBtn = document.querySelector(".setCommit .ui-button-warning");
  const select = document.querySelector('[name="commit__style"]');
  const input = setCommit.querySelector("input");

  saveBtn.onclick = () => {
    if (!input.value) {
      new LightTip().error("必须填写 commit 内容");
      return;
    }
    saveBtn.classList.add("loading");
    cancelBtn.classList.add("disabled");
    const content = `${select.value}:${input.value}`;
    fetch("/push-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lan,
        commit: content,
      }),
    })
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        if (res?.code === 200 && res?.message === "push-success") {
          new LightTip().success(res?.data || lan + " Push 成功");
          saveBtn.classList.remove("loading");
          item.classList.remove("loading");
          cancelBtn.classList.remove("disabled");
          setCommit.remove();
        } else {
          new LightTip().error(res?.data || lan + " Push 失败");
          saveBtn.classList.remove("loading");
          cancelBtn.classList.remove("disabled");
        }
      });
  };

  cancelBtn.onclick = () => {
    item.classList.remove("loading");
    setCommit.remove();
  };
};

let modifiedModel, originalModel, diffEditor;
function setEditor(path = "", originalText = "", modifiedText = "") {
  if (originalModel) originalModel.dispose();
  if (modifiedModel) modifiedModel.dispose();
  if (diffEditor) diffEditor.dispose();
  if (editor) editor.dispose();
  require.config({
    paths: {
      vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.1/min/vs",
    },
  });
  let lan = "";
  if (path.endsWith(".js")) lan = "javascript";
  if (path.endsWith(".css")) lan = "css";
  if (path.endsWith(".scss")) lan = "scss";
  if (path.endsWith(".json")) lan = "json";
  if (path.endsWith(".tpl")) lan = "html";

  require(["vs/editor/editor.main"], function () {
    originalModel = monaco.editor.createModel(originalText, "text/plain");
    modifiedModel = monaco.editor.createModel(modifiedText, "text/plain");
    diffEditor = monaco.editor.createDiffEditor(
      document.querySelector("#compare"),
      {
        scrollBeyondLastLine: false,
        diffWordWrap: true,
        wordWrap: "on",
        enableSplitViewResizing: false,
        originalEditable: true,
        automaticLayout: true,
      }
    );
    diffEditor.setModel({
      original: originalModel,
      modified: modifiedModel,
    });
    // editor = monaco.editor.create(document.querySelector("#compare"), {
    //   value: obj,
    //   language: lan,
    //   automaticLayout: true,
    //   theme: "vs-dark",
    //   fontSize: 16,
    //   fontFamily: "JetBrains Mono",
    //   scrollbar: {
    //     vertical: "hidden",
    //     horizontal: "hidden",
    //   },
    //   wordWrap: "on",
    //   lineNumbers: true,
    //   lineHeight: 40,
    //   minimap: {
    //     enabled: false,
    //   },
    // });
  });
}

const diffHTML = function (data = {}, lan = "", path = "") {
  const html = `
    <div class="diffHTML">
      <div class="diffHTML-header">
        <a href="javascript:" data-lan="${lan}" class="ui-button ui-button-primary" id="Save" role="button">Save</a>
        <a href="javascript:" class="ui-button ui-button-warning" id="Cancel" role="button">Cancel</a>
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
  setEditor(data.nowC.content, path);
  // const doc = new Mergely("#compare", {
  //   sidebar: true,
  //   ignorews: false,
  //   license: "lgpl-separate-notice",
  //   lhs: data.nowC.content,
  //   rhs: data.initC.content,
  //   cmsettings: {
  //     readOnly: false,
  //   },
  //   theme: "dark",
  // });
  // doc.once('updated', () => {
  //   doc.once('updated', () => {
  //     doc.scrollToDiff('next');
  //   });
  // });

  Save.onclick = () => {
    const content = doc.get("lhs");
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
};

const handleGetFile = () => {
  handleBtn.onclick = () => {
    if (!isWatching) {
      new LightTip().error("请点击开启 Watch 监听");
      return;
    }
    const select = document.querySelector(".wrappper__sider_01 select");
    const checkboxes = document.querySelectorAll("[name='checkbox']:checked");
    var selectedValues = [];
    checkboxes.forEach(function (checkbox) {
      selectedValues.push(checkbox.value);
    });
    if (!selectedValues?.length) {
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
        if (res.code === 200 && res?.data?.length) {
          res?.data.forEach((item) => {
            if (item.startsWith("img/")) {
              imgs.push(item);
            }
          });
          const header = document.querySelector(".wrappper__content-header");
          const content = document.querySelector(".wrappper__content-content");
          header.innerHTML = "";
          content.innerHTML = "";
          selectedValues.forEach((lan) => {
            createContent(lan, res?.data, res?.data2, select.value);
          });
        } else {
          new LightTip().error("无数据");
        }
      })
      .catch((err) => {
        console.log("err", err);
      });
  };
};

const selectOnChange = () => {
  const select = document.querySelector(".wrappper__sider_01 select");
  select.addEventListener("change", function () {
    const selectedValue = select.value;
    selectLan = selectedValue;
    const header = document.querySelector(".wrappper__content-header");
    const content = document.querySelector(".wrappper__content-content");
    header.innerHTML = "";
    content.innerHTML = "";
    // const divLanActive = document.querySelector(".div-lan.disabled");
    // if (divLanActive) divLanActive.classList.remove("disabled");
    // const divLan = document.querySelector(`.div-${selectedValue}`);
    // if (divLan) divLan.classList.add("disabled");
    // const checkboxes = document.querySelectorAll("input[name='checkbox']");
    // checkboxes.forEach(function (checkbox) {
    //   checkbox.checked = false;
    // });
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

window.addEventListener("load", () => {
  watchBtnListen();
  handleSocket();
  handleGetFile();
  selectOnChange();
  logOut();
});
