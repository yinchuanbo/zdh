const { exec } = require("child_process");

async function mergeCode({ lan, localPaths, from, to }) {
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
    if (status) {
      throw new Error("工作目录不干净，有未提交的更改");
    }
  }

  async function gitCheckout(branch) {
    await executeGitCommand(`git checkout ${branch}`);
  }

  async function gitPullRebase() {
    try {
      const { stdout, stderr } = await executeGitCommand("git pull --rebase");
      if (stderr.includes("CONFLICT") || stdout.includes("CONFLICT")) {
        throw new Error("执行 git pull --rebase 时发生冲突");
      }
    } catch (error) {
      if (error.message.includes("冲突")) {
        throw error;
      }
      if (error.message.includes("There is no tracking information for the current branch")) {
        console.warn("没有跟踪分支，跳过 git pull 操作，继续执行下一步。");
        return;
      }
      try {
        const { stdout, stderr } = await executeGitCommand("git pull");
        if (stderr) {
          if (stderr.includes("There is no tracking information for the current branch")) {
            console.warn("没有跟踪分支，跳过 git pull 操作，继续执行下一步。");
            return;
          }
          throw new Error(`git pull 失败: ${stderr}`);
        }
        console.log("git pull 成功");
      } catch (pullError) {
        throw new Error(`git pull 和 git pull --rebase 都失败: ${pullError.message}`);
      }
    }
  }

  async function gitMerge(branch) {
    const { stdout, stderr } = await executeGitCommand(`git merge ${branch} --no-ff`);
    if (stderr.includes("CONFLICT") || stdout.includes("CONFLICT")) {
      throw new Error("执行git merge时发生冲突");
    }
  }
  try {
    await checkGitStatus();
    await gitCheckout(to);
    await gitPullRebase();
    await gitMerge(from);
    return Promise.resolve("代码成功合并");
  } catch (error) {
    return Promise.reject(error.message);
  }
}

module.exports = mergeCode;