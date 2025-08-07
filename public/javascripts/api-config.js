// 站点配置
const SITES_CONFIG = {
  "vidnoz-website": {
    name: "vidnoz",
    test: "https://api-test.vidnoz.com",
    prod: "https://api.vidnoz.com",
    fixedHeaders: {
      "x-task-version": "2.0.0",
      "request-app": "ai",
    },
  },
  "vidqu-website": {
    name: "vidqu",
    test: "https://tool-api-test.vidqu.ai",
    prod: "https://tool-api.vidqu.ai",
    fixedHeaders: {
      "x-task-version": "2.0.0",
    },
  },
};

// 默认Content-Type对应的请求体格式提示
const CONTENT_TYPE_EXAMPLES = {
  "application/json":
    '{\n  "key": "value",\n  "number": 123,\n  "boolean": true\n}',
  "application/x-www-form-urlencoded": "key1=value1&key2=value2",
  "text/plain": "纯文本内容",
  "application/xml":
    '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <item>value</item>\n</root>',
};
