// sse.js
const clients = [];

// 注册 SSE 客户端
function registerClient(res) {
  clients.push(res);
  console.log("客户端连接，当前客户端数:", clients.length);

  // 心跳定时器
  const heartbeat = setInterval(() => {
    try {
      res.write(":\n\n"); // 发送空注释行作为心跳
    } catch (err) {
      console.error("心跳发送失败:", err);
    }
  }, 20000); // 每 20 秒发送一次心跳

  // 客户端断开时清理
  res.on("close", () => {
    clearInterval(heartbeat);
    const index = clients.indexOf(res);
    if (index !== -1) clients.splice(index, 1);
    console.log("客户端断开，当前客户端数:", clients.length);
  });
}

// 发送 SSE 消息给所有客户端
function sendSSEMessage(message) {
  const data = typeof message === "object" ? JSON.stringify(message) : message;
  console.log("发送消息给客户端:", clients?.length, data);
  clients.forEach((client) => {
    try {
      client.write(`data: ${data}\n\n`);
    } catch (err) {
      console.error("发送 SSE 消息失败:", err);
    }
  });
}

export { registerClient, sendSSEMessage };
