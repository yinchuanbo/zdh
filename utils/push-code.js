const { exec } = require("child_process");

async function pullCode({ lan, localPaths }) {
  const curP = localPaths[lan];
  function executeGitCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, { cwd: curP }, (error, stdout, stderr) => {
        if (error) {
          return reject(error);
        }
        resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
      });
    });
  }
  async function checkGitStatus() {
    const { stdout: status } = await executeGitCommand(
      "git status --porcelain"
    );
    console.log("status", status);
    if (status) {
      throw new Error("工作目录不干净，有未提交的更改");
    }
  }
  async function gitPullRebase() {
    const { stdout, stderr } = await executeGitCommand("git pull --rebase");
    if (stderr.includes("CONFLICT") || stdout.includes("CONFLICT")) {
      throw new Error("执行git pull --rebase时发生冲突");
    }
    return stdout;
  }
  try {
    await checkGitStatus();
    await gitPullRebase();
    return Promise.resolve("代码成功拉取并rebase");
  } catch (error) {
    return Promise.reject(error.message);
  }
}

async function pushCode({ lan, commit = "提交", localPaths }) {
  const curP = localPaths[lan];

  function executeGitCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, { cwd: curP }, (error, stdout, stderr) => {
        if (error) {
          return reject(error);
        }
        resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
      });
    });
  }

  try {
    const { stdout: status } = await executeGitCommand(
      "git status --porcelain"
    );
    if (!status) {
      throw new Error("没有文件需要推送");
    }
    await executeGitCommand("git add .");
    console.log("已添加所有更改");
    const { stdout: commitResult } = await executeGitCommand(
      `git commit -m "${commit}"`
    );
    console.log("提交结果:", commitResult);
    await pullCode({ lan, localPaths });
    console.log("成功拉取并rebase最新代码");
    const { stdout: pushResult } = await executeGitCommand("git push");
    console.log("推送结果:", pushResult);
    return Promise.resolve("代码成功推送到远程仓库");
  } catch (error) {
    console.log("error", error);
    return Promise.reject(`推送失败: ${error.message}`);
  }
}
module.exports = pushCode;
