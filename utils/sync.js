const fs = require("fs");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generate = require("@babel/generator").default;
const { execSync } = require("child_process");

function getStagedFiles(sourcePath) {
  const splitText = "templates\\new-template\\";
  const sourcePathArr = sourcePath.split(splitText);
  const sourcePath01 = sourcePathArr[0];
  const sourcePath02 = `${splitText}${sourcePathArr[1]}`;
  process.chdir(sourcePath01);
  try {
    const stagedContent = execSync(`git diff --cached -U0 "${sourcePath02}"`, {
      encoding: "utf-8",
    });
    return stagedContent;
  } catch (error) {
    console.error(`Error getting staged content for ${sourcePath02}:`, error);
    return null;
  }
}

function parseCode(code) {
  try {
    return parser.parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript", "decorators-legacy"],
    });
  } catch (error) {
    console.error("代码解析失败:", error);
    throw error;
  }
}

function parseDiff(diff) {
  const changes = [];
  const lines = diff.split("\n");
  let currentHunk = null;

  for (const line of lines) {
    if (line.startsWith("@@")) {
      // 新的代码块标记
      const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
      if (match) {
        currentHunk = {
          startLine: parseInt(match[2]),
          code: [],
        };
      }
    } else if (line.startsWith("+") && !line.startsWith("+++") && currentHunk) {
      // 添加的行
      currentHunk.code.push(line.slice(1));
    } else if (line.startsWith("-") && !line.startsWith("---")) {
      // 删除的行 - 在这里我们可能需要特殊处理
      continue;
    }

    if (currentHunk && currentHunk.code.length > 0) {
      changes.push(currentHunk);
      currentHunk = null;
    }
  }

  return changes;
}

function getDeclarations(code) {
  const ast = parseCode(code);
  const declarations = [];

  traverse(ast, {
    VariableDeclaration(path) {
      declarations.push({
        type: "variable",
        name: path.node.declarations[0].id.name,
        code: generate(path.node).code,
      });
    },
    FunctionDeclaration(path) {
      if (path.node.id) {
        declarations.push({
          type: "function",
          name: path.node.id.name,
          code: generate(path.node).code,
        });
      }
    },
    ClassDeclaration(path) {
      if (path.node.id) {
        declarations.push({
          type: "class",
          name: path.node.id.name,
          code: generate(path.node).code,
        });
      }
    },
  });

  return declarations;
}

function updateTargetCode(targetCode, changedDeclarations) {
  const targetAst = parseCode(targetCode);
  const updatedCode = targetCode;
  let offset = 0;

  traverse(targetAst, {
    enter(path) {
      if (
        path.isVariableDeclaration() ||
        path.isFunctionDeclaration() ||
        path.isClassDeclaration()
      ) {
        const name =
          path.node.id?.name || path.node.declarations?.[0]?.id?.name;
        const matchingDeclaration = changedDeclarations.find(
          (d) => d.name === name
        );

        if (matchingDeclaration) {
          const start = path.node.start + offset;
          const end = path.node.end + offset;
          updatedCode =
            updatedCode.slice(0, start) +
            matchingDeclaration.code +
            updatedCode.slice(end);
          offset += matchingDeclaration.code.length - (end - start);
        }
      }
    },
  });

  return updatedCode;
}

function main({ result }) {
  for (const key in result) {
    const files = result[key];
    if (files?.length) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const sourcePath = key;
        const targetPath = file;
        if (sourcePath.trim() === targetPath.trim()) continue;
        try {
          const editCotent = getStagedFiles(sourcePath);
          const changes = parseDiff(editCotent);
          const changedCode = changes
            .map((change) => change.code.join("\n"))
            .join("\n");
          const changedDeclarations = getDeclarations(changedCode);
          if (changedDeclarations.length === 0) {
            console.log("没有需要同步的声明修改");
            return;
          }
          // 读取目标文件
          const targetContent = fs.readFileSync(targetPath, "utf8");
          // 更新目标文件代码
          const updatedContent = updateTargetCode(
            targetContent,
            changedDeclarations
          );
          // 写入更新后的代码
          fs.writeFileSync(targetPath, updatedContent, "utf8");
        } catch (error) {
          console.error("同步过程中发生错误:", error);
        }
      }
    }
  }
  console.log("同步完成");
}

module.exports = main;
