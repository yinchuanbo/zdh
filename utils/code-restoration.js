const simpleGit = require('simple-git');
const settings = require("./settings");
const fs = require("fs");
const prettier = require("prettier");

function extractFilenames(fileList) {
  let arr = fileList.map(file => file.filename);
  arr = arr.filter(item => item.includes("/Dev/") || item.includes("/lan/") || item.includes("/img/") || item.includes("/tpl/"))
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

async function getFileContentsForCommit({
  commitHash,
  pathVal,
  filename
}) {
  const git = simpleGit(pathVal);
  let completePath = `${pathVal}/${filename}`.replaceAll("\\", "/")
  let setInfo = {};

  if (filename.endsWith(".js")) {
    setInfo = settings();
  }

  if (filename.endsWith(".tpl")) {
    setInfo = settings("html");
  }

  if (filename.endsWith(".css")) {
    setInfo = settings("css");
  }

  if (filename.endsWith(".scss")) {
    setInfo = settings("scss");
  }

  if (filename.endsWith(".json")) {
    setInfo = settings("json");
  }

  try {
    let beforeContent = '';
    let afterContent = '';
    const status = await git.show([`${commitHash}:${filename}`]);
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
      try {
        afterContent = await prettier.format(afterContent, setInfo);
      } catch (error) {
        throw new Error(error)
      }
    }
    return { filename, beforeContent, afterContent };
  } catch (err) {
    return Promise.reject(err)
  }
}

function setFile({
  pathVal,
  filename,
  content
}) {
  let completePath = `${pathVal}/${filename}`.replaceAll("\\", "/");
  try {
    fs.writeFileSync(completePath, content, 'utf8');
    return Promise.resolve()
  } catch (err) {
    return Promise.resolve(err?.message)
  }
}

module.exports = {
  getCommitFileChanges,
  getFileContentsForCommit,
  setFile
}