const fs = require('fs');
const path = require('path');

// 读取并解析 package.json
const packagePath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// 解析当前版本号
const currentVersion = packageJson.version;
const versionParts = currentVersion.split('.').map(Number);

// 增加补丁号（最后一位）
versionParts[2] += 1;

// 更新版本号
const newVersion = versionParts.join('.');
packageJson.version = newVersion;

// 将新的 package.json 写回文件
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2), 'utf8');

console.log(`Version bumped to ${newVersion}`);
