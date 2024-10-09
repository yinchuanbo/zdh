const { exec } = require("child_process");

async function discardCode({
  lan,
  localPaths,
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
  // 撤销未放入暂存区的代码，已放入暂存区的不撤销
  try {
    const { stdout: status } = await executeGitCommand("git status --porcelain");
    if (!status) {
      throw new Error(`没有要丢弃的更改`);
    }
    await executeGitCommand("git checkout -- .");
    const { stdout: remainingStatus } = await executeGitCommand("git status --porcelain");
    if (remainingStatus) {
      return "未暂存的更改已被丢弃，暂存的更改仍然存在";
    } else {
      return "所有未暂存的更改都已被丢弃，没有暂存的更改";
    }
  } catch (error) {
    console.error("Error discarding changes:", error);
    throw new Error(`未能丢弃更改: ${error.message}`);
  }
}

module.exports = discardCode;
