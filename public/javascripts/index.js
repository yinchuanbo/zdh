const socket = io("http://localhost:3000");
let imgs = [];
let isWatching = false;

let editor = null, jsonEditor = null;

const watchBtn = document.querySelector(".watch-btn");
const handleBtn = document.querySelector(".handle-btn");

let selectLan = document.querySelector(".wrappper__sider_01 select").value;

let isFirst = false;

let curP = null;

let data2Info = {};

const setWatch = () => {
  fetch("/watching?bool=" + isWatching);
};

const watchBtnListen = () => {
  watchBtn.onclick = () => {
    isWatching = !isWatching;
    if (isWatching) {
      watchBtn.innerHTML = "Watching";
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
        watchBtn.innerHTML = "Watching";
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
      <a href="javascript:" class="ui-button ui-button-warning pull-code" role="button" data-lan="${lan}">*Pull</a>
      <a href="javascript:" class="ui-button ui-button-primary discard-code" role="button" data-lan="${lan}"  style="display: ${selectLan === lan ? "none" : ""}">Discard</a>
      <a href="javascript:" class="ui-button ui-button-primary commit-code" role="button" data-lan="${lan}" style="display: none">Commit</a>
      <a href="javascript:" class="ui-button ui-button-primary merge-code" role="button" data-lan="${lan}">Merge</a>
      <a href="javascript:" class="ui-button ui-button-primary push-code" role="button" data-lan="${lan}">Commit + Push</a>
      <a href="javascript:" class="ui-button ui-button-primary dey-to-test" role="button" data-lan="${lan}" style="display: none">上传至 ${lan} Test Ftp</a>
      <a href="javascript:" class="ui-button ui-button-primary dey-to-pro" role="button" data-lan="${lan}" style="display: none">上传至 ${lan} Pro Ftp</a>
      <a href="javascript:" class="ui-button ui-button-primary all-img" style="display: ${selectLan === lan ? "none" : ""}" role="button" data-lan="${lan}">Resource Batching</a>
      <a href="javascript:" class="ui-button ui-button-success publish" role="button" data-lan="${lan}">Publish</a>
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
          <div class="filename">
            <div class="tpl__ele_origin" title="[${initLan}] ${info}">[${initLan}] ${info}</div>
            <!--<div class="tpl__ele_arrow">↓</div>-->
            <div class="tpl__ele" title="[${lan}] ${lujing}" data-es="${info.endsWith(".tpl") && selectLan !== lan ? "tpl" : ""}">[${lan}] ${lujing}</div>
          </div>
          <div class="btns">
           <a href="javascript:" class="ui-button ui-button-primary async-res" style="display: ${selectLan === lan ? "none" : ""}" role="button">Diff</a>
           <a href="javascript:" class="ui-button ui-button-primary one-deploy" role="button" style="display: ${info.endsWith(".json") ? "none" : ""}">To Test</a>
          </div>
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
  const commitCode = document.querySelectorAll(".commit-code");
  const discardCode = document.querySelectorAll(".discard-code");
  const mergeCodes = document.querySelectorAll(".merge-code");

  tplEles.forEach((item) => {
    item.onclick = () => {
      const { es } = item.dataset;
      if (es === "tpl") {
        item.setAttribute("contentEditable", true);
      }
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
      item.classList.add("loading");
      const p = item.parentNode.parentNode;
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
            diffHTML(res.data, lan, path, initLan);
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

  commitCode.forEach((item) => {
    item.onclick = () => {
      if (isWatching) {
        new LightTip().error("请先关闭 Watching，其他操作需要开启");
        return;
      }
      item.classList.add("loading");
      const { lan } = item.dataset;
      fetch("/check-status", {
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
          if (res?.code === 200 && res?.message === "check-status-success") {
            if (res?.data) {
              new LightTip().error("无修改可用来 commit");
            } else {
              setCommit(item, lan, res?.data || false, "commit");
            }
          } else {
            new LightTip().error("无修改可用来 commit");
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
      item.classList.add("loading");
      const { lan } = item.dataset;
      fetch("/discard-code", {
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
          if (res?.code === 200 && res?.message === "discard-success") {
            new LightTip().success(res?.data || "代码撤销成功");
          } else {
            new LightTip().error(res?.data || "代码撤销失败");
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
      setCommit(item, lan);
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
};

const setCommit = (item, lan, status = false) => {
  let type = "";
  const html = `
    <div class="setCommit">
      <div class="setCommit_left">
        <div class="select-type">
          <div class="select-type-item">
            <input type="radio" id="radio1" name="handle-type" value="commit" checked="checked">
            <label for="radio1" class="ui-radio"></label><label for="radio1" style="padding-left: 5px;">Commit</label>
          </div>
          <div class="select-type-item">
            <input type="radio" id="radio2"  value="push" name="handle-type">
            <label for="radio2" class="ui-radio"></label><label for="radio2" style="padding-left: 5px;">Push</label>
          </div>
        </div>
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
  function removeLoading(str = '', bool = false) {
    if (bool) {
      new LightTip().success(str);
    } else {
      new LightTip().error(str);
    }
    saveBtn.classList.remove("loading");
    cancelBtn.classList.remove("disabled");
  }
  saveBtn.onclick = async () => {
    const radio = document.querySelector("input[name='handle-type']:checked")
    if (!input.value) {
      removeLoading("必须填写 commit 内容")
      return;
    }
    saveBtn.classList.add("loading");
    cancelBtn.classList.add("disabled");

    const { code, message, data } = await fetch("/check-status", {
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
    if (!(code === 200 && message === 'check-status-success')) {
      removeLoading("操作失败");
      return;
    }
    if (radio.value === 'commit') {
      if (data) {
        removeLoading("无修改可用来 commit");
        return;
      } else {
        type = "commit"
      }
    } else if (radio.value === 'push') {
      if (data) {
        fetch("/push-code", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lan,
            status: true
          }),
        })
          .then((res) => {
            return res.json();
          })
          .then((res) => {
            if (res?.code === 200 && res?.message === "push-success") {
              removeLoading(res?.data || lan + " Push 成功", true)
            } else {
              removeLoading(res?.data || lan + " Push 失败")
            }
            item.classList.remove("loading");
          });
        return;
      }
    }
    const content = `${select.value}:${input.value}`;
    fetch("/push-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lan,
        commit: content,
        type
      }),
    })
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        if (res?.code === 200 && res?.message === "push-success") {
          removeLoading(res?.data || lan + " Push 成功", true)
          item.classList.remove("loading");
          setCommit.remove();
        } else {
          removeLoading(res?.data || lan + " Push 失败")
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

let modifiedModel, originalModel, diffEditor;
function setEditor(path = "", originalText = "", modifiedText = "") {
  if (originalModel) originalModel.dispose();
  if (modifiedModel) modifiedModel.dispose();
  if (diffEditor) diffEditor.dispose();
  modifiedModel = null;
  originalModel = null;
  diffEditor = null;
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
      }
    );
    diffEditor.setModel({
      original: originalModel,
      modified: modifiedModel,
    });
  });
}

const diffHTML = function (data = {}, lan = "", path = "", initLan = "") {
  let doc = null;
  const html = `
    <div class="diffHTML">
      <div class="diffHTML-header">
        <a href="javascript:" data-lan="${lan}" class="ui-button ui-button-primary" id="Save" role="button">Save</a>
        <a href="javascript:" class="ui-button ui-button-warning red_button" id="Cancel" role="button">Cancel</a>
      </div>
      <div class="diffHTML__path">
        ${path.endsWith('.json') ? `<span class="diffHTML__path-title">${lan}</span>` : `<span class="diffHTML__path-title">${lan}</span><span class="diffHTML__path-title">${initLan}</span>`}
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
    // doc = new Mergely("#compare", {
    //   sidebar: true,
    //   ignorews: false,
    //   license: "lgpl-separate-notice",
    //   lhs: data.nowC.content,
    //   rhs: data.initC.content,
    //   cmsettings: {
    //     readOnly: false,
    //   }
    // });
    // doc.once('updated', () => {
    //   doc.once('updated', () => {
    //     doc.scrollToDiff('next');
    //   });
    // });
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
    const content = jsonEditor?.getValue?.() || doc?.get?.("lhs") || originalModel?.getValue?.();;
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
};

const handleNoData = () => {
  const contentDom = document.querySelector(".wrappper__content-content");
  const noData = `<div class="no-data"><p>No Data</p></div>`;
  contentDom.innerHTML = "";
  contentDom.insertAdjacentHTML("beforeend", noData);
};

const handleGetFile = () => {
  handleNoData();
  handleBtn.onclick = () => {
    if (!isWatching) {
      new LightTip().error("请点击开启 Watch 监听");
      return;
    }
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
          selectedValues.forEach((lan) => {
            createContent(lan, res?.data, res?.data2, select.value);
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
    handleNoData();
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
