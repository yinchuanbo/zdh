const wrappperCenter = document.querySelector(".wrappper__center");
const addDom = document.querySelector(".add");
const setDom = document.querySelector(".set");
const pathDom = document.querySelector(".path");
const domainDom = document.querySelector(".domain");
const wrapperBack = document.querySelector(".wrapper__back")

let lansObj = {};
let portsObj = {};
let pathname = "";
let domain = "";

let obj = {};

addDom.onclick = () => {
  const html = `
    <div class="wrappper__center__item">
      <input class="ui-input lan" placeholder="语言" />
      <input class="ui-input filename" placeholder="文件夹" />
      <input class="ui-input port" placeholder="端口号" />
      <span class="delete"></span>
    </div>
  `;
  addDom.insertAdjacentHTML("beforebegin", html);
  deleteFun()
};

setDom.onclick = () => {
  const lans = document.querySelectorAll(".lan");
  lans.forEach((item) => {
    const lanVal = item.value.toLowerCase();
    const p = item.parentNode;
    const filename = p.querySelector(".filename");
    const filenameVal = filename.value;
    const port = p.querySelector(".port");
    const portVal = port.value;
    lansObj[lanVal] = filenameVal;
    portsObj[lanVal] = portVal;
  });
  obj = {
    pathname: pathDom.value,
    domain: domainDom.value,
    lans: lansObj,
    ports: portsObj,
  };
  fetch("/settings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: obj,
    }),
  })
    .then((res) => {
      return res.json();
    })
    .then((res) => {
      if (res?.code === 200 && res?.message === "settings-success") {
        new LightTip().success("设置成功");
        setTimeout(() => {
          window.location.href = "/";
        }, 1500)
      } else {
        new LightTip().error("设置失败");
      }
    });
};

function deleteFun() {
  const deleteDom = document.querySelectorAll(".delete");
  deleteDom.forEach((item) => {
    item.onclick = () => {
      item.parentNode.remove();
    };
  });
}

deleteFun();

wrapperBack.onclick = () => {
  window.location.href = "/";
}