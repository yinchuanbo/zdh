# PKG 打包说明

本项目已配置 PKG 打包功能，可以将 Node.js 应用打包成独立的可执行文件。

## 安装依赖

首先安装项目依赖（包括 pkg）：

```bash
npm install
# 或者
pnpm install
```

## 构建命令

### 构建所有平台
```bash
npm run build
```

### 构建特定平台
```bash
# Windows 64位
npm run build:win

# Linux 64位
npm run build:linux

# macOS 64位
npm run build:mac
```

## 输出文件

构建完成后，可执行文件将生成在 `dist/` 目录中：

- Windows: `zdh-win.exe`
- Linux: `zdh-linux`
- macOS: `zdh-macos`

## PKG 配置说明

项目的 PKG 配置位于 `package.json` 中的 `pkg` 字段：

- **scripts**: 指定需要打包的脚本文件
- **assets**: 指定需要包含的静态资源文件
- **targets**: 指定目标平台和 Node.js 版本
- **outputPath**: 指定输出目录

## 兼容性处理

项目已经处理了以下 PKG 兼容性问题：

1. **Prettier 兼容性**: 在 PKG 环境中自动跳过 Prettier 功能
2. **动态文件加载**: 使用 `fs.readFileSync` + `eval` 替代动态 `require`
3. **静态资源**: 确保 EJS 模板和公共文件正确打包

## 注意事项

1. 打包后的可执行文件包含了 Node.js 运行时，文件较大（通常 50MB+）
2. 某些动态加载的模块可能需要额外配置
3. 环境变量和配置文件需要在运行时提供
4. 数据库连接等外部依赖需要在目标环境中可用

## 运行打包后的应用

```bash
# Windows
.\dist\zdh-win.exe

# Linux/macOS
./dist/zdh-linux
./dist/zdh-macos
```

## 故障排除

### 打包问题

如果遇到打包问题：

1. 检查 `.pkgignore` 文件，确保不需要的文件被排除
2. 检查 `pkg.scripts` 配置，确保所有必要的脚本文件都被包含
3. 检查 `pkg.assets` 配置，确保所有静态资源都被包含
4. 查看 PKG 构建日志，寻找错误信息

### 运行时模块错误

如果遇到 "Cannot find module" 错误：

1. **动态模块加载问题**：
   - 错误示例：`Cannot find module 'C:\snapshot\zdh\node_modules\axios\dist\node\axios.cjs'`
   - 解决方案：将相关模块添加到 `package.json` 的 `pkg.assets` 数组中

2. **已包含的模块**：
   - axios（HTTP 客户端）
   - ssh2-sftp-client（SFTP 客户端）
   - cheerio（HTML 解析）
   - socket.io（WebSocket）
   - bcrypt（密码加密）
   - jsonwebtoken（JWT 令牌）
   - simple-git（Git 操作）
   - chokidar（文件监控）
   - terser（代码压缩）
   - sass（CSS 预处理器）
   - @babel（代码转换）

3. **添加新模块**：
   ```json
   "pkg": {
     "assets": [
       "node_modules/your-module/**/*"
     ]
   }
   ```

4. **条件加载处理**：
   代码中已实现 prettier 的条件加载示例：
   ```javascript
   let prettier;
   try {
     if (process.pkg) {
       prettier = null;
     } else {
       prettier = require("prettier");
     }
   } catch (error) {
     prettier = null;
   }
   ```