const { exec } = require("child_process");

async function checkStaus({ lan, localPaths }) {
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
      return false;
    } else {
      return true;
    }
  }
  try {
    const res = await checkGitStatus();
    return Promise.resolve(res);
  } catch (error) {
    return Promise.reject(error.message);
  }
}

module.exports = checkStaus;
