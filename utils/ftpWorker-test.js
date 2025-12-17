const { parentPort } = require("worker_threads");
const Client = require("ssh2-sftp-client");
const fs = require("fs");

parentPort.on("message", async ({ key, values, env, configs }) => {
  let testConn, LocalList, devList;
  if (env === "test") {
    testConn = {
      ...configs.testConn,
      // 优化连接配置
      readyTimeout: 30000,
      keepaliveInterval: 10000,
    };
    LocalList = configs.LocalListTest;
    devList = configs.testFoldList;
  } else {
    testConn = {
      ...configs.proConn,
      readyTimeout: 30000,
      keepaliveInterval: 10000,
    };
    LocalList = configs.LocalListPro;
    devList = configs.proFoldList;
  }

  const sftp = new Client();
  const createdDirs = new Set();
  let totalFiles = values.length;
  let completedFiles = 0;

  try {
    console.log('尝试链接')
    await sftp.connect(testConn);

    for (let i = 0; i < values.length; i++) {
      const dir = values[i];
      const localFilePath = `${LocalList[key]}${dir.replace(/\//g, "\\")}`;
      const remoteFilePath = `${devList[key]}${dir}`;
      const remoteDir = remoteFilePath.substring(0, remoteFilePath.lastIndexOf("/"));

      // 只在需要时创建目录
      if (!createdDirs.has(remoteDir)) {
        const exists = await sftp.exists(remoteDir);
        if (!exists) {
          await sftp.mkdir(remoteDir, true);
        }
        createdDirs.add(remoteDir);
      }

      // 使用优化的上传配置
      await sftp.fastPut(localFilePath, remoteFilePath, {
        step: (transferred, chunk, total) => {
          // 发送进度信息
          parentPort.postMessage({
            type: 'progress',
            key,
            file: dir,
            current: i + 1,
            total: totalFiles,
            fileProgress: Math.round((transferred / total) * 100)
          });
        },
        concurrency: 64,
        chunkSize: 32768  // 32KB chunks
      });

      completedFiles++;
      
      // 只对关键文件进行大小验证
      if (dir.match(/\.(js|css|html)$/)) {
        const [localSize, remoteSize] = await Promise.all([
          fs.promises.stat(localFilePath).then(stat => stat.size),
          sftp.stat(remoteFilePath).then(stat => stat.size)
        ]);

        if (localSize !== remoteSize) {
          throw new Error(`Size mismatch for ${dir}`);
        }
      }

      // 发送总体进度
      parentPort.postMessage({
        type: 'totalProgress',
        key,
        progress: Math.round((completedFiles / totalFiles) * 100)
      });
    }

    await sftp.end();
    parentPort.postMessage({ type: 'complete', success: true, key });
  } catch (error) {
    await sftp.end();
    parentPort.postMessage({ type: 'error', success: false, key, error: error.message });
  }
});
