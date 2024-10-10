const getFiles = document.querySelector(".getFiles");
const preview = document.querySelector(".preview");
const upload = document.querySelector(".upload");
let filesObj = null;
let editor = null;

const radios = document.querySelectorAll('input[name="env"]');

radios.forEach((radio) => {
  radio.addEventListener("change", function () {
    filesObj = null;
  });
});

const checkboxs = document.querySelectorAll('input[name="lan"]');

checkboxs.forEach((cb) => {
  cb.addEventListener("change", function () {
    filesObj = null;
  });
});

getFiles.onclick = () => {
  const getEnv = document.querySelector("[name='env']:checked").value;
  const getLangs = document.querySelectorAll("[name='lan']:checked");
  const selectedValues = Array.from(getLangs).map((checkbox) => checkbox.value);
  if (!selectedValues?.length) {
    new LightTip().error("请选择语言");
    return;
  }
  getFiles.classList.add("loading");
  let obj = {};
  for (let i = 0; i < selectedValues.length; i++) {
    const val = selectedValues[i];
    const input = document.querySelector(`.input-${val}`);
    obj[val] = input?.value || "";
  }
  fetch("/ftp/get-files", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      env: getEnv,
      data: obj,
    }),
  })
    .then((res) => {
      return res.json();
    })
    .then((res) => {
      if (res?.code === 200 && res?.message === "ftp-success") {
        filesObj = res?.data;
        new LightTip().success("获取修改文件成功");
      } else {
        new LightTip().error("获取修改文件失败");
      }
      getFiles.classList.remove("loading");
    });
};

preview.onclick = () => {
  if (!filesObj) {
    new LightTip().error("请先获取修改文件");
    return;
  }
  let previewDom = document.querySelector(".preview__mark");
  if (previewDom) previewDom.remove();
  const html = `<div class="preview__mark">
    <a href="javascript:" class="ui-button ui-button-primary save-files" role="button">Save</a>
    <a href="javascript:" class="ui-button ui-button-warning cancel-files" role="button">Cancel</a>
  </div>`;
  document.body.insertAdjacentHTML("beforeend", html);
  const saveFiles = document.querySelector(".save-files");
  const cancelFiles = document.querySelector(".cancel-files");
  setEditor(filesObj);
  function removeMark() {
    if (editor) editor.dispose();
    previewDom = document.querySelector(".preview__mark");
    if (previewDom) previewDom.remove();
  }
  saveFiles.onclick = () => {
    if (editor) {
      const value = editor.getValue();
      console.log('这里2')
      filesObj = JSON.stringify(JSON.parse(value), null, 2);
      removeMark();
    }
  };
  cancelFiles.onclick = removeMark;
};

function setEditor(obj = {}) {
  if (editor) editor.dispose();
  require.config({
    paths: {
      vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.1/min/vs",
    },
  });
  require(["vs/editor/editor.main"], function () {
    editor = monaco.editor.create(document.querySelector(".preview__mark"), {
      value: obj,
      language: "json",
      automaticLayout: true,
      theme: "vs-dark",
      fontSize: 16,
      fontFamily: "JetBrains Mono",
      scrollbar: {
        vertical: "hidden",
        horizontal: "hidden",
      },
      wordWrap: "on",
      lineNumbers: true,
      lineHeight: 40,
      minimap: {
        enabled: false,
      },
    });
  });
}

upload.onclick = () => {
  const getEnv = document.querySelector("[name='env']:checked").value;
  if (!filesObj) {
    new LightTip().error("请先获取修改文件");
    return;
  }
  upload.classList.add("loading");
  fetch("/ftp/upload-ftp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      env: getEnv,
      data: JSON.parse(filesObj),
    }),
  })
    .then((res) => {
      return res.json();
    })
    .then((res) => {
      if (res?.code === 200 && res?.message === "ftp-upload-success") {
        new LightTip().success(`${getEnv} 上传 ftp 成功`);
      } else {
        new LightTip().error(`${getEnv} 上传 ftp 失败`);
      }
      upload.classList.remove("loading");
    });
};

const wrapperBack = document.querySelector(".wrapper__back")
wrapperBack.onclick = () => {
  window.close()
}

const pullNewCodes = document.querySelectorAll(".pull-new-code")

pullNewCodes.forEach(item => {
  item.onclick = () => {
    const { lan } = item.dataset;
    item.classList.add("loading");
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
  }
})