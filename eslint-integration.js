const { ESLint } = require("eslint");

function createESLintInstance(overrideConfig) {
  return new ESLint({
    overrideConfigFile: true,
    overrideConfig,
    fix: true,
  });
}

async function lintAndFixFiles(eslint, filePaths) {
  const results = await eslint.lintFiles(filePaths);
  await ESLint.outputFixes(results);
  return results;
}

async function lintAndFixText(eslint, content) {
  const results = await eslint.lintText(content, {
    filePath: 'input.js', // 默认文件路径
  });
  return results;
}

function outputLintingResults(results) {
  const problems = results.reduce(
    (acc, result) => acc + result.errorCount + result.warningCount,
    0,
  );
  if (problems > 0) {
    const errorMessages = results.flatMap(result =>
      result.messages.map(msg => {
        return `<div class="js-error"><span>${msg.ruleId || 'unknown rule'}</span> <span>at ${result.filePath} (line ${msg.line}, column ${msg.column})</span>: <span>${msg.message}</span></div>`;
      })
    );
    throw new Error(`${errorMessages.join('\n')}`);
  } else {
    console.log("No linting errors found.");
  }
  return results;
}

async function lintFiles(input) {
  const overrideConfig = {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        // Window object
        window: 'readonly',
        self: 'readonly',

        // DOM
        document: 'readonly',
        Document: 'readonly',
        HTMLElement: 'readonly',
        Element: 'readonly',
        Node: 'readonly',
        Event: 'readonly',

        // Console
        console: 'readonly',

        // Timers
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',

        // AJAX and Fetch
        XMLHttpRequest: 'readonly',
        fetch: 'readonly',
        Headers: 'readonly',
        Request: 'readonly',
        Response: 'readonly',

        // Storage
        localStorage: 'readonly',
        sessionStorage: 'readonly',

        // Location and History
        location: 'readonly',
        history: 'readonly',

        // Navigator
        navigator: 'readonly',

        // Other commonly used APIs
        JSON: 'readonly',
        Math: 'readonly',
        Date: 'readonly',
        parseInt: 'readonly',
        parseFloat: 'readonly',
        isNaN: 'readonly',
        isFinite: 'readonly',
        decodeURI: 'readonly',
        decodeURIComponent: 'readonly',
        encodeURI: 'readonly',
        encodeURIComponent: 'readonly',
        AbortController: 'readonly',
        FormData: 'readonly',

        // Constructors
        Array: 'readonly',
        Boolean: 'readonly',
        Number: 'readonly',
        Object: 'readonly',
        RegExp: 'readonly',
        String: 'readonly',

        // Error types
        Error: 'readonly',
        EvalError: 'readonly',
        RangeError: 'readonly',
        ReferenceError: 'readonly',
        SyntaxError: 'readonly',
        TypeError: 'readonly',
        URIError: 'readonly',

        // Promises
        Promise: 'readonly',

        // ES6+ features
        Map: 'readonly',
        Set: 'readonly',
        WeakMap: 'readonly',
        WeakSet: 'readonly',
        Symbol: 'readonly',
        Proxy: 'readonly',
        Reflect: 'readonly',

        // Web APIs
        FileReader: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        WebSocket: 'readonly',
        Worker: 'readonly',

        // Audio and Video
        Audio: 'readonly',
        Image: 'readonly',
        MediaQueryList: 'readonly',

        // LIB
        $: 'readonly',
        faceapi: 'readonly',
        Swiper: 'readonly',
        File: 'readonly',

        // Custom
        setCookie: 'readonly',
        gtag: 'readonly',
        getCookie: 'readonly',
        reject: 'readonly',
        XTASKVERSION: 'readonly',
        textContentObj: 'readonly',
        gsap: 'readonly',
        splitRGB: 'readonly',
        hex2rgb: 'readonly',
        showLoginWindow: 'readonly'
      },
    },
    rules: {
      // Possible Errors
      'no-extra-semi': 'error',           // 禁止不必要的分号
      'no-unexpected-multiline': 'error', // 禁止混淆多行表达式
      'no-unreachable': 'error',          // 禁止在 return、throw、continue 和 break 语句之后出现不可达代码
      'no-unsafe-finally': 'error',       // 禁止在 finally 语句块中出现控制流语句
      //'no-duplicate-case': 'error',       // 禁止重复的 case 标签
      'no-irregular-whitespace': 'error', // 禁止不规则的空白

      // Best Practices
      'eqeqeq': ['error', 'always'],      // 要求使用 === 和 !==
      'no-eval': 'error',                 // 禁用 eval()
      'no-implied-eval': 'error',         // 禁止使用类似 eval() 的方法
      'no-multi-spaces': 'error',         // 禁止使用多个空格
      'no-floating-decimal': 'error',     // 禁止数字字面量中使用前导和末尾小数点
      'no-global-assign': 'error',        // 禁止对原生对象或只读的全局对象进行赋值
      'no-loop-func': 'error',            // 禁止在循环中出现函数声明和表达式
      //'no-magic-numbers': ['warn', { ignore: [-1, 0, 1, 2] }], // 禁用魔术数字
      'no-multi-str': 'error',            // 禁止使用多行字符串
      'no-new-func': 'error',             // 禁止使用 new 以避免产生副作用
      'no-return-assign': 'error',        // 禁止在 return 语句中使用赋值语句

      // Variables
      'no-undef': 'error',                // 禁用未声明的变量
      'no-use-before-define': ['error', { functions: false, classes: true }], // 禁止在变量定义之前使用它们

      // Stylistic Issues
      'semi': ['error', 'always'],        // 要求或禁止使用分号
      'no-mixed-spaces-and-tabs': 'error',// 禁止空格和 tab 的混合缩进
      'array-bracket-spacing': ['error', 'never'], // 强制数组方括号中使用一致的空格
      'block-spacing': 'error',           // 强制在代码块中使用一致的大括号风格
      'brace-style': 'error',             // 强制在代码块中使用一致的大括号风格
      //'camelcase': 'error',               // 强制使用骆驼拼写法命名约定
      'comma-dangle': ['error', 'always-multiline'], // 要求或禁止末尾逗号
      //'comma-spacing': 'error',           // 强制在逗号前后使用一致的空格
      'comma-style': 'error',             // 强制使用一致的逗号风格
      //'consistent-this': ['error', 'self'],// 当获取当前执行环境的上下文时，强制使用一致的命名
      'func-call-spacing': 'error',       // 要求或禁止在函数标识符和其调用之间有空格
      'key-spacing': 'error',             // 强制在对象字面量的属性中键和值之间使用一致的间距
      //'max-len': ['error', { code: 100 }],// 强制一行的最大长度

      // ES6
      //'arrow-spacing': 'error',           // 强制箭头函数的箭头前后使用一致的空格
      'no-confusing-arrow': 'error',      // 禁止在可能与比较操作符相混淆的地方使用箭头函数
      'no-duplicate-imports': 'error',    // 禁止重复模块导入
      'no-useless-computed-key': 'error', // 禁止在对象中使用不必要的计算属性
      'no-useless-constructor': 'error',  // 禁用不必要的构造函数
      //'prefer-arrow-callback': 'error',   // 要求使用箭头函数作为回调
      //'prefer-const': 'error',            // 要求使用 const 声明那些声明后不再被修改的变量
      //'prefer-destructuring': 'error',    // 优先使用数组和对象解构
      //'prefer-template': 'error',         // 要求使用模板字面量而非字符串连接

      // Allowing console for debugging
      'no-console': 'off',
      //'no-var': 'error',                  // 要求使用 let 或 const 而不是 var
      //'no-unused-vars': 'warn'
    },
  };

  const eslint = createESLintInstance(overrideConfig);
  let results;

  if (typeof input === 'string') {
    results = await lintAndFixFiles(eslint, [input]);
  } else if (Array.isArray(input)) {
    if (input.every(item => typeof item === 'string')) {
      results = await lintAndFixFiles(eslint, input);
    } else {
      results = await Promise.all(
        input.map(item => {
          if (item.content) {
            return lintAndFixText(eslint, item.content);
          } else if (item.filePath) {
            return lintAndFixFiles(eslint, [item.filePath]);
          } else {
            throw new Error('Each item must contain either content or filePath');
          }
        })
      );
      results = results.flat();
    }
  } else if (typeof input === 'object' && input !== null) {
    if (input.content && input.filePath) {
      throw new Error('Please provide either content or filePath, not both');
    }
    if (input.content) {
      results = await lintAndFixText(eslint, input.content);
    } else if (input.filePath) {
      results = await lintAndFixFiles(eslint, [input.filePath]);
    } else {
      throw new Error('Object must contain either content or filePath');
    }
  } else {
    throw new Error('Invalid input type. Expected file path(s) or content object(s).');
  }

  return outputLintingResults(results);
}

module.exports = { lintFiles };