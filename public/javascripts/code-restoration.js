const okBtn = document.querySelector(".ok")
const proPath = document.querySelector(".proPath")
const wrappperBody = document.querySelector(".wrappper__body")
const proComminIds = document.querySelector(".proComminIds")

let doc = null;

const renderList = ({ data = [] }) => {
  const html = `
    <div class="code-list">
      ${data?.map(item => {
    return `<div class="code-item" data-path="${item}">
      <p>${item}</p>
      <a
          href="javascript:"
          class="ui-button ui-button-primary back"
          role="button"
          >Back</a
        >
    </div>`
  }).join("")
    }
    </div>
  `;
  wrappperBody.innerHTML = ''
  wrappperBody.insertAdjacentHTML("beforeend", html)
  const backs = document.querySelectorAll(".back")
  backs.forEach(item => {
    item.onclick = () => {
      doc = null;
      const pathVal = proPath.value;
      const commitVal = proComminIds.value;
      const { path } = item.parentNode.dataset;
      fetch("/code-restoration/get-code-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pathVal,
          fileP: path,
          commitVal
        }),
      }).then((res) => {
        return res.json();
      }).then(res => {
        if (res?.message === 'code-content-success') {
          const { filename, beforeContent, afterContent, changedLines } = res?.data;
          renderCompareHTML({ filename, beforeContent, afterContent, pathVal, backBtn: item, changedLines })
        } else {
          new LightTip().error(res?.message);
        }
      })
    }
  })
}

function renderCompareHTML({ filename, beforeContent, afterContent, pathVal, backBtn, changedLines = [] }) {
  const html = `
    <div class="compare-html">
      <div class="compare-header">
        <a href="javascript:"class="ui-button ui-button-primary" id="PrevCode" role="button">Prev</a>
        <a href="javascript:"class="ui-button ui-button-primary" id="NextCode" role="button">Next</a>
        <input class="ui-input" id="SearchCode" placeholder="Search..." />
        <select id="SelectCode">
          <option value="">选择差异行数</option>
          ${changedLines.map(item => {
    return `<option value="${item}">${item}</option>`
  })
    }
      </select>
        <a href="javascript:"class="ui-button ui-button-primary" id="SaveCode" role="button">Save</a>
        <a href="javascript:" class="ui-button ui-button-warning red_button" id="CancelCode" role="button">Cancel</a>
      </div>
      <div class="compare-body" id="compare"></div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", html);
  const compareHtml = document.querySelector(".compare-html")
  doc = new Mergely("#compare", {
    sidebar: true,
    ignorews: false,
    license: "lgpl-separate-notice",
    lhs: afterContent,
    rhs: beforeContent,
    bgcolor: "#3c3c3c",
    cmsettings: {
      readOnly: false,
    },
  });
  doc.once("updated", () => {
    doc.once("updated", () => {
      doc.scrollToDiff("next");
    });
  });
  SaveCode.onclick = () => {
    fetch("/code-restoration/save-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pathVal,
        filename,
        content: doc.get("lhs")
      }),
    }).then((res) => {
      return res.json();
    }).then(res => {
      if (res?.message !== 'code-save-success') {
        new Dialog({
          title: "Error Info",
          content: res?.data,
        });
      } else {
        doc = null;
        if (backBtn) backBtn.parentNode.classList.add('b')
        compareHtml.remove();
      }
    })
  }
  CancelCode.onclick = () => {
    doc = null;
    compareHtml.remove();
  }
  PrevCode.onclick = () => {
    doc.scrollToDiff("prev");
  };
  NextCode.onclick = () => {
    doc.scrollToDiff("next");
  };
  SearchCode.onchange = () => {
    const val = SearchCode.value.trim()
    doc.search('rhs', val);
  }
  SelectCode.onchange = () => {
    const val = SelectCode.value.trim()
    doc.scrollTo('rhs', Number(val || 0));
  }
}

okBtn.onclick = () => {
  const pathVal = proPath.value;
  const commitVal = proComminIds.value;
  if (!pathVal || !commitVal) {
    new LightTip().error('请输入项目路径或该项目对应的 commitId');
    return;
  }
  okBtn.classList.add('loading')
  fetch("/code-restoration/get-code-restoration", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pathVal,
      commitVal
    }),
  }).then((res) => {
    return res.json();
  }).then(res => {
    const { code, data, message } = res;
    if (code === 200 && data?.length) {
      renderList({
        data
      })
    } else {
      new LightTip().error(message);
    }
  }).catch(err => {
    new LightTip().error(err?.message || err);
  }).finally(() => {
    okBtn.classList.remove('loading')
  })
}