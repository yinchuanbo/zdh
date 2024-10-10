const { exec } = require("child_process");

async function discardCode({
  lan,
  localPaths,
  isChecked = false
}) {
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
    const { stdout: status } = await executeGitCommand("git status --porcelain");
    if (!status) {
      throw new Error(`没有要丢弃的更改`);
    }

    // 撤销未放入暂存区的代码
    await executeGitCommand("git checkout -- .");

    // 如果 isChecked 为 true，将暂存区的文件移出暂存区
    if (isChecked) {
      await executeGitCommand("git reset HEAD .");
      await executeGitCommand("git checkout -- .");
    }

    const { stdout: remainingStatus } = await executeGitCommand("git status --porcelain");

    if (remainingStatus) {
      return isChecked
        ? "未暂存的更改已被丢弃，暂存的更改已被移出暂存区但文件内容保留"
        : "未暂存的更改已被丢弃，暂存的更改仍然存在";
    } else {
      return isChecked
        ? "所有更改都已被移出暂存区，未暂存的更改已被丢弃"
        : "所有未暂存的更改都已被丢弃，没有暂存的更改";
    }
  } catch (error) {
    console.error("Error discarding changes:", error);
    throw new Error(`未能丢弃更改: ${error.message}`);
  }
}

module.exports = discardCode;