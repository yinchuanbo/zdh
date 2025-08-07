class ApiTester {
  constructor() {
    this.currentSite = "";
    this.currentEnv = "test";
    this.pollingInterval = null;
    this.isPolling = false;
    this.pollingIntervalTime = 10000; // 10秒
    this.init();
  }

  init() {
    this.initSiteSelector();
    this.initEventListeners();
    this.initTabs();
    this.addDefaultRows();
  }

  initSiteSelector() {
    const siteSelect = document.getElementById("site");
    siteSelect.innerHTML = '<option value="">Select Site</option>';

    Object.keys(SITES_CONFIG).forEach((siteKey) => {
      const option = document.createElement("option");
      option.value = siteKey;
      option.textContent = SITES_CONFIG[siteKey].name;
      siteSelect.appendChild(option);
    });
  }

  initEventListeners() {
    // 环境切换
    document.getElementById("environment").addEventListener("change", (e) => {
      this.currentEnv = e.target.value;
      this.updateFixedHeaders();
    });

    // 站点切换
    document.getElementById("site").addEventListener("change", (e) => {
      this.currentSite = e.target.value;
      this.updateFixedHeaders();
    });

    // Content-Type变化时更新请求体示例
    document.getElementById("content-type").addEventListener("change", (e) => {
      this.updateBodyExample(e.target.value);
    });

    // 发送请求
    document.getElementById("send-btn").addEventListener("click", () => {
      this.sendRequest();
    });

    // 轮询按钮
    document.getElementById("polling-btn").addEventListener("click", () => {
      this.togglePolling();
    });

    // 添加请求头
    document.getElementById("add-header").addEventListener("click", () => {
      this.addHeaderRow();
    });

    // 添加参数
    document.getElementById("add-param").addEventListener("click", () => {
      this.addParamRow();
    });

    // 标签页切换
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });
  }

  initTabs() {
    this.switchTab("headers");
  }

  switchTab(tabName) {
    // 移除所有活动状态
    document
      .querySelectorAll(".tab-btn")
      .forEach((btn) => btn.classList.remove("active"));
    document
      .querySelectorAll(".tab-panel")
      .forEach((panel) => panel.classList.remove("active"));

    // 激活当前标签
    document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");
    document.getElementById(`${tabName}-tab`).classList.add("active");
  }

  addDefaultRows() {
    // 添加默认的自定义请求头行
    this.addHeaderRow();
    // 添加默认的参数行
    this.addParamRow();
  }

  updateFixedHeaders() {
    const fixedHeadersDiv = document.getElementById("fixed-headers");
    fixedHeadersDiv.innerHTML = "";

    if (this.currentSite && SITES_CONFIG[this.currentSite]) {
      const headers = SITES_CONFIG[this.currentSite].fixedHeaders;
      Object.entries(headers).forEach(([key, value]) => {
        const headerRow = document.createElement("div");
        headerRow.className = "header-row";
        headerRow.innerHTML = `
                    <input type="text" value="${key}" class="header-key" readonly>
                    <input type="text" value="${value}" class="header-value" readonly>
                    <span style="padding: 6px 12px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; border-radius: 6px; font-size: 12px; font-weight: 500;">Fixed</span>
                `;
        fixedHeadersDiv.appendChild(headerRow);
      });
    }
  }

  addHeaderRow() {
    const headersDiv = document.getElementById("custom-headers");
    const headerRow = document.createElement("div");
    headerRow.className = "header-row";
    headerRow.innerHTML = `
            <input type="text" placeholder="Header Name" class="header-key">
            <input type="text" placeholder="Header Value" class="header-value">
            <button class="remove-header">Delete</button>
        `;

    // 添加删除事件
    headerRow.querySelector(".remove-header").addEventListener("click", () => {
      headerRow.remove();
    });

    headersDiv.appendChild(headerRow);
  }

  addParamRow() {
    const paramsDiv = document.getElementById("params-section");
    const paramRow = document.createElement("div");
    paramRow.className = "param-row";
    paramRow.innerHTML = `
            <input type="text" placeholder="Param Name" class="param-key">
            <input type="text" placeholder="Param Value" class="param-value">
            <button class="remove-param">Delete</button>
        `;

    // 添加删除事件
    paramRow.querySelector(".remove-param").addEventListener("click", () => {
      paramRow.remove();
    });

    paramsDiv.appendChild(paramRow);
  }

  updateBodyExample(contentType) {
    const bodyTextarea = document.getElementById("request-body");
    if (CONTENT_TYPE_EXAMPLES[contentType]) {
      bodyTextarea.placeholder = `Example Format:\n${CONTENT_TYPE_EXAMPLES[contentType]}`;
    }
  }

  getFullUrl() {
    if (!this.currentSite) {
      throw new Error("Please select a site");
    }

    const siteConfig = SITES_CONFIG[this.currentSite];
    const baseUrl = siteConfig[this.currentEnv];
    const path = document.getElementById("url").value.trim();

    if (!path) {
      throw new Error("Please enter the API path");
    }

    // 确保路径以/开头
    const normalizedPath = path.startsWith("/") ? path : "/" + path;
    return baseUrl + normalizedPath;
  }

  getHeaders() {
    const headers = {};

    // 添加Content-Type
    const contentType = document.getElementById("content-type").value;
    if (contentType) {
      headers["Content-Type"] = contentType;
    }

    // 添加固定请求头
    if (this.currentSite && SITES_CONFIG[this.currentSite]) {
      Object.assign(headers, SITES_CONFIG[this.currentSite].fixedHeaders);
    }

    // 添加自定义请求头
    document.querySelectorAll("#custom-headers .header-row").forEach((row) => {
      const key = row.querySelector(".header-key").value.trim();
      const value = row.querySelector(".header-value").value.trim();
      if (key && value) {
        headers[key] = value;
      }
    });

    return headers;
  }

  getParams() {
    const params = {};
    document.querySelectorAll("#params-section .param-row").forEach((row) => {
      const key = row.querySelector(".param-key").value.trim();
      const value = row.querySelector(".param-value").value.trim();
      if (key && value) {
        params[key] = value;
      }
    });
    return params;
  }

  getRequestBody() {
    const method = document.getElementById("method").value;
    if (method === "GET") return null;

    const contentType = document.getElementById("content-type").value;
    const bodyText = document.getElementById("request-body").value.trim();

    if (!bodyText) return null;

    if (contentType === "application/json") {
      try {
        JSON.parse(bodyText); // 验证JSON格式
        return bodyText;
      } catch (e) {
        throw new Error("Request body JSON format error");
      }
    }

    return bodyText;
  }

  buildUrlWithParams(url, params) {
    if (Object.keys(params).length === 0) return url;

    const urlObj = new URL(url);
    Object.entries(params).forEach(([key, value]) => {
      urlObj.searchParams.append(key, value);
    });
    return urlObj.toString();
  }

  async sendRequest() {
    try {
      const method = document.getElementById("method").value;
      const baseUrl = this.getFullUrl();
      const headers = this.getHeaders();
      const params = this.getParams();
      const body = this.getRequestBody();

      // 构建完整URL（包含查询参数）
      const fullUrl = this.buildUrlWithParams(baseUrl, params);

      // 显示请求开始
      this.showResponse("Sending request...", "", "");

      const startTime = Date.now();

      // 构建fetch选项
      const fetchOptions = {
        method: method,
        headers: headers,
      };

      // 只有非GET请求才添加body
      if (method !== "GET" && body) {
        fetchOptions.body = body;
      }

      // 发送请求
      const response = await fetch(fullUrl, fetchOptions);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // 获取响应文本
      const responseText = await response.text();

      // 尝试格式化JSON响应
      let formattedResponse = responseText;
      try {
        const jsonData = JSON.parse(responseText);
        formattedResponse = JSON.stringify(jsonData, null, 2);
      } catch (e) {
        // 不是JSON格式，保持原样
      }

      // 显示响应结果
      this.showResponse(
        formattedResponse,
        `Status Code: ${response.status} ${response.statusText}`,
        `Response Time: ${responseTime}ms`
      );
    } catch (error) {
      this.showResponse(`Request failed: ${error.message}`, "Error", "");
    }
  }

  showResponse(body, status, time) {
    document.getElementById("response-body").textContent = body;
    document.getElementById("status-code").textContent = status;
    document.getElementById("response-time").textContent = time;
  }

  togglePolling() {
    const pollingBtn = document.getElementById("polling-btn");

    if (this.isPolling) {
      // 停止轮询
      this.stopPolling();
      pollingBtn.textContent = "Start Polling";
      pollingBtn.classList.remove("active");
    } else {
      // 开始轮询
      this.startPolling();
      pollingBtn.textContent = "Stop Polling";
      pollingBtn.classList.add("active");
    }
  }

  startPolling() {
    if (this.isPolling) return;

    this.isPolling = true;

    // 立即发送一次请求
    this.sendRequest();

    // 设置定时器
    this.pollingInterval = setInterval(() => {
      if (this.isPolling) {
        this.sendRequest();
      }
    }, this.pollingIntervalTime);

    console.log(
      `Start Polling, interval ${this.pollingIntervalTime / 1000} seconds`
    );
  }

  stopPolling() {
    if (!this.isPolling) return;

    this.isPolling = false;

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    console.log("Stop Polling");
  }

  async sendRequest() {
    try {
      const method = document.getElementById("method").value;
      const baseUrl = this.getFullUrl();
      const headers = this.getHeaders();
      const params = this.getParams();
      const body = this.getRequestBody();

      // 构建完整URL（包含查询参数）
      const fullUrl = this.buildUrlWithParams(baseUrl, params);

      // 显示请求开始（只在非轮询模式或第一次请求时显示）
      if (
        !this.isPolling ||
        !document.getElementById("response-body").textContent
      ) {
        this.showResponse("Sending request...", "", "");
      }

      const startTime = Date.now();

      // 构建fetch选项
      const fetchOptions = {
        method: method,
        headers: headers,
      };

      // 只有非GET请求才添加body
      if (method !== "GET" && body) {
        fetchOptions.body = body;
      }

      // 发送请求
      const response = await fetch(fullUrl, fetchOptions);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // 获取响应文本
      const responseText = await response.text();

      // 尝试格式化JSON响应
      let formattedResponse = responseText;
      try {
        const jsonData = JSON.parse(responseText);
        formattedResponse = JSON.stringify(jsonData, null, 2);
      } catch (e) {
        // 不是JSON格式，保持原样
      }

      // 显示响应结果
      const statusText = `Status Code: ${response.status} ${response.statusText}`;
      const timeText = `Response Time: ${responseTime}ms`;
      const pollingText = this.isPolling ? " | Polling..." : "";

      this.showResponse(formattedResponse, statusText, timeText + pollingText);
    } catch (error) {
      const errorText = `Request failed: ${error.message}`;
      const pollingText = this.isPolling ? " | Polling..." : "";

      this.showResponse(errorText, "Error", pollingText);
    }
  }
}

// 初始化应用
document.addEventListener("DOMContentLoaded", () => {
  window.apiTester = new ApiTester();
});

// 页面卸载时清理轮询
window.addEventListener("beforeunload", () => {
  if (window.apiTester && window.apiTester.isPolling) {
    window.apiTester.stopPolling();
  }
});
