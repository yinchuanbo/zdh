const { execSync } = require("child_process");
const fs = require("fs");

/**
 * 执行Git命令
 * @param {string} command Git命令
 * @param {string} cwd 工作目录
 * @returns {string} 命令输出
 */
function execGitCommand(command, cwd) {
  try {
    return execSync(command, { cwd, encoding: "utf8" });
  } catch (error) {
    throw new Error(`Git命令执行失败: ${error.message}`);
  }
}

/**
 * 获取当前分支名
 * @param {string} lanRoot 项目根目录
 * @returns {string} 当前分支名
 */
function getCurrentBranch(lanRoot) {
  return execGitCommand("git rev-parse --abbrev-ref HEAD", lanRoot).trim();
}

/**
 * 检查仓库状态
 * @param {string} lanRoot 项目根目录
 * @returns {boolean} 是否需要push
 */
function checkRepoStatus(lanRoot) {
  // 获取当前分支
  const currentBranch = getCurrentBranch(lanRoot);

  // 检查工作区和暂存区是否有修改
  const status = execGitCommand("git status --porcelain", lanRoot);

  // 检查是否有未推送的提交
  const unpushedCommits = execGitCommand(
    `git log origin/${currentBranch}..HEAD`,
    lanRoot
  );

  if (!status && !unpushedCommits) {
    return false; // 没有修改且没有未推送的提交，不需要push
  }

  // 如果有未跟踪的文件，且工作区有修改，则需要处理
  if (status) {
    const untrackedFiles = execGitCommand(
      "git ls-files --others --exclude-standard",
      lanRoot
    );
    if (untrackedFiles) {
      throw new Error("存在未跟踪的文件，请先处理");
    }
  }

  return true;
}

/**
 * 批量push代码到远程仓库
 * @param {Object} params 参数对象
 * @param {string[]} params.lans 语言列表
 * @param {string} params.commit commit信息
 * @param {Object} params.localPaths 本地路径映射
 * @returns {Object} 执行结果
 */
async function allPush({ lans, commit, localPaths }) {
  const results = {
    success: [],
    errors: [],
  };

  for (let i = 0; i < lans.length; i++) {
    const lan = lans[i];
    const lanRoot = localPaths[lan];

    try {
      // 检查目录是否存在
      if (!fs.existsSync(lanRoot)) {
        throw new Error(`目录不存在: ${lanRoot}`);
      }

      const currentBranch = getCurrentBranch(lanRoot);

      // 检查是否有未提交的修改
      const hasChanges = execGitCommand(
        "git status --porcelain",
        lanRoot
      ).trim();

      // 检查是否有未推送的提交
      const unpushedCommits = execGitCommand(
        "git log origin/" + currentBranch + "..HEAD",
        lanRoot
      ).trim();

      // 如果既没有修改也没有未推送的提交，跳过
      if (!hasChanges && !unpushedCommits) {
        console.log(`[${lan}] 没有需要提交或推送的修改，跳过`);
        continue;
      }

      // 如果有未提交的修改，先提交
      if (hasChanges) {
        console.log(`[${lan}] 提交本地修改...`);
        execGitCommand("git add .", lanRoot);
        execGitCommand(`git commit -m "${commit}"`, lanRoot);
      }

      // 拉取最新代码
      console.log(`[${lan}] 拉取最新代码...`);
      execGitCommand("git fetch origin", lanRoot);

      try {
        execGitCommand(`git pull --rebase origin ${currentBranch}`, lanRoot);
      } catch (pullError) {
        // 只有当 rebase 确实在进行中时才中止它
        try {
          const rebaseStatus = execGitCommand("git status", lanRoot);
          if (rebaseStatus.includes("rebase in progress")) {
            execGitCommand("git rebase --abort", lanRoot);
          }
        } catch (abortError) {
          // 忽略中止 rebase 时的错误
        }
        throw new Error(`拉取代码失败: ${pullError.message}`);
      }

      // 推送到远程
      console.log(`[${lan}] 推送到远程...`);
      execGitCommand(`git push origin ${currentBranch}`, lanRoot);

      results.success.push({
        lan,
        path: lanRoot,
        message: "推送成功",
      });
    } catch (error) {
      results.errors.push({
        lan,
        path: lanRoot,
        error: error.message,
      });
      console.error(`[${lan}] 错误:`, error.message);
      // 继续执行下一个项目
      continue;
    }
  }

  return results;
}

module.exports = allPush;
