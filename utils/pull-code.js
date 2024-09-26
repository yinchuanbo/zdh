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

module.exports = pullCode;
