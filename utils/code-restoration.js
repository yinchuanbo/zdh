const simpleGit = require('simple-git');
const settings = require("./settings");
const fs = require("fs");
const prettier = require("prettier");
const acorn = require('acorn');
const { lintFiles } = require("../eslint-integration")
const sass = require("sass")
const diff = require('diff');
// const { checkScssProperties, formatResults } = require('../scss-property-lint');

function extractFilenames(fileList) {
  let arr = fileList.map(file => file.filename);
  arr = arr.filter(item => item.includes("/Dev/") || item.includes("/lan/") || item.includes("/tpl/"))
  return arr;
}

async function getCommitFileChanges({
  commitHash,
  pathVal
}) {
  const git = simpleGit(pathVal);
  try {
    const commit = await git.show([commitHash, '--name-status', '--format=%b']);
    const fileChanges = commit.split('\n')
      .filter(line => line.startsWith('M') || line.startsWith('A') || line.startsWith('D'))
      .map(line => {
        const [status, filename] = line.split('\t');
        return { status, filename };
      });
    const fileContentsPromises = fileChanges.map(async ({ status, filename }) => {
      return { filename };
    });
    const fileContents = await Promise.all(fileContentsPromises);
    return extractFilenames(fileContents);
  } catch (err) {
    return Promise.reject(err)
  }
}
function getChangedLines(beforeContent, afterContent) {
  const diffResult = diff.diffLines(beforeContent, afterContent);
  const changedLineNumbers = new Set();

  let beforeLineNumber = 1;
  let afterLineNumber = 1;

  diffResult.forEach(part => {
    if (part.added) {
      changedLineNumbers.add(afterLineNumber);
      afterLineNumber += part.count || 0;
    } else if (part.removed) {
      changedLineNumbers.add(beforeLineNumber);
      beforeLineNumber += part.count || 0;
    } else {
      beforeLineNumber += part.count || 0;
      afterLineNumber += part.count || 0;
    }
  });
  return Array.from(changedLineNumbers);
}

async function getFileContentsForCommit({
  commitHash,
  pathVal,
  filename
}) {
  const git = simpleGit(pathVal);
  let completePath = `${pathVal}/${filename}`.replaceAll("\\", "/")
  let setInfo = settings(filename)
  try {
    let beforeContent = '';
    let afterContent = '', afterContentOrigin = '';
    const status = await git.show([`${commitHash}:${filename}`])
    if (filename.includes("/img/") || filename.includes("\\img\\")) {
      if (status === 'A') {
        console.log('11111')
        // 新增文件
        beforeContent = 'NEW_FILE';
        afterContent = await fs.promises.readFile(completePath, { encoding: 'base64' });
      } else if (status === 'D') {
        console.log('2222')
        // 删除文件
        beforeContent = await fs.promises.readFile(`${pathVal}/${filename}^`, { encoding: 'base64' });
        afterContent = 'DELETED_FILE';
      } else {
        console.log('3333')
        // 修改文件
        beforeContent = await fs.promises.readFile(`${pathVal}/${filename}^`, { encoding: 'base64' });
        afterContent = await fs.promises.readFile(completePath, { encoding: 'base64' });
      }
      return { filename, beforeContent, afterContent };
    }
    if (status !== 'A') {
      beforeContent = await git.show([`${commitHash}^:${filename}`]);
      try {
        beforeContent = await prettier.format(beforeContent, setInfo);
      } catch (error) {
        throw new Error(error)
      }
    }
    if (status !== 'D') {
      afterContent = fs.readFileSync(completePath, 'utf-8');
      afterContentOrigin = await git.show([`${commitHash}:${filename}`])
      try {
        afterContent = await prettier.format(afterContent, setInfo);
        afterContentOrigin = await prettier.format(afterContentOrigin, setInfo);
      } catch (error) {
        throw new Error(error)
      }
    }
    const changedLines = getChangedLines(beforeContent, afterContentOrigin);
    return { filename, beforeContent, afterContent, changedLines };
  } catch (err) {
    return Promise.reject(err)
  }
}

function checkSyntax(code) {
  try {
    acorn.parse(code, { ecmaVersion: "latest" });
    return true;
  } catch (err) {
    return 'Syntax error:' + err.message;
  }
}

async function setFile({
  pathVal,
  filename,
  content
}) {
  let completePath = `${pathVal}/${filename}`.replaceAll("\\", "/");
  try {

    if (filename.endsWith('.js')) {
      await lintFiles({ content })
      const res1 = checkSyntax(content)
      if (res1 !== true) throw new Error(res1)
    } else if (filename.endsWith('.scss') || filename.endsWith('.css')) {
      sass.compileString(content, {
        syntax: 'scss',
        sourceMap: false,
      });
      // const result = await checkScssProperties({ content });
      // console.log('result', result)
      // if (!result?.isValid) {
      //   const checkRes = formatResults(result)
      //   return Promise.reject(checkRes)
      // }
    }
    fs.writeFileSync(completePath, content, 'utf8');
    return Promise.resolve()
  } catch (err) {
    console.log("err", err)
    return Promise.reject(err?.message)
  }
}

module.exports = {
  getCommitFileChanges,
  getFileContentsForCommit,
  setFile
}