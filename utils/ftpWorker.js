const { parentPort } = require("worker_threads");
const ftp = require("basic-ftp");
const fs = require("fs");

parentPort.on("message", async ({ key, values, env, configs }) => {
  let testConn, LocalList, devList;
  if (env === "test") {
    testConn = {
      ...configs.testConn,
    };
    LocalList = configs.LocalListTest;
    devList = configs.testFoldList;
  } else {
    testConn = {
      ...configs.proConn,
    };
    LocalList = configs.LocalListPro;
    devList = configs.proFoldList;
  }

  const client = new ftp.Client(120000);
  // client.ftp.verbose = true; 
  const createdDirs = new Set();
  let totalFiles = values.length;
  let completedFiles = 0;

  try {
    console.log('尝试链接')
    
    const ftpConfig = {
      host: testConn.host,
      port: testConn.port === 22 ? 21 : (testConn.port || 21),
      user: testConn.username || testConn.user,
      password: testConn.password,
      secure: false
    };

    await client.access(ftpConfig);
    if (client?.ftp?.socket) {
      client.ftp.socket.setKeepAlive(true);
      client.ftp.socket.setTimeout(120000);
    }
    if (client?.ftp) {
      client.ftp.timeout = 120000;
    }
    console.log('FTP 连接成功');
    console.log('当前工作目录:', await client.pwd());

    for (let i = 0; i < values.length; i++) {
      const dir = values[i];
      const localFilePath = `${LocalList[key]}${dir.replace(/\//g, "\\")}`;
      let remoteFilePath = `${devList[key]}${dir}`;
      
      // 适配 FTP 路径：去除 /html 前缀，因为 FTP 用户通常被锁定在 web 根目录
      if (remoteFilePath.startsWith('/html/')) {
        remoteFilePath = remoteFilePath.replace('/html/', '');
      }
      
      // 确保使用相对路径（移除开头的 /），避免某些 FTP 服务器对绝对路径的权限限制
      if (remoteFilePath.startsWith('/')) {
        remoteFilePath = remoteFilePath.substring(1);
      }

      const remoteDir = remoteFilePath.substring(0, remoteFilePath.lastIndexOf("/"));
      const fileName = remoteFilePath.substring(remoteFilePath.lastIndexOf("/") + 1);

      // 切换目录逻辑：
      // 如果目录发生了变化，先回到根目录，再进入/创建目标目录
      // 这样可以避免相对路径叠加导致的问题，也能确保 ensureDir 从根目录开始寻找
      if (remoteDir !== client.lastRemoteDir) {
        await client.cd('/');
        if (remoteDir) {
          await client.ensureDir(remoteDir);
        }
        client.lastRemoteDir = remoteDir;
      }

      const fileSize = (await fs.promises.stat(localFilePath)).size;

      // 设置进度追踪
      client.trackProgress(info => {
        parentPort.postMessage({
          type: 'progress',
          key,
          file: dir,
          current: i + 1,
          total: totalFiles,
          fileProgress: fileSize > 0 ? Math.round((info.bytes / fileSize) * 100) : 100
        });
      });

      // 上传文件 - 此时 CWD 已经在目标目录，只需要传文件名
      // FTP 协议默认 STOR 命令就是覆盖或新建
      try {
        await client.uploadFrom(localFilePath, fileName);
      } catch (err) {
        if (err.code === 550) {
          throw new Error(`Permission denied (550). 请检查 FTP 服务器上该目录的写入权限: ${remoteDir}`);
        }
        throw err;
      }
      
      client.trackProgress(); // 清除进度追踪

      completedFiles++;
      
      // 只对关键文件进行大小验证
      if (dir.match(/\.(js|css|html)$/)) {
        try {
          const remoteSize = await client.size(fileName);
          if (fileSize !== remoteSize) {
            throw new Error(`Size mismatch for ${dir}`);
          }
        } catch (e) {
          const msg = e && e.message ? e.message : "";
          if (!msg.includes("Timeout")) {
            throw e;
          }
        }
      }

      // 发送总体进度
      parentPort.postMessage({
        type: 'totalProgress',
        key,
        progress: Math.round((completedFiles / totalFiles) * 100)
      });
    }

    client.close();
    parentPort.postMessage({ type: 'complete', success: true, key });
  } catch (error) {
    client.close();
    parentPort.postMessage({ type: 'error', success: false, key, error: error.message });
  }
});
