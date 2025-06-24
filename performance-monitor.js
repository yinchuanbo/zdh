/**
 * 轻量级性能监控工具
 * 不依赖外部库，提供基本的性能监控功能
 */
const os = require("os");
const fs = require("fs");
const path = require("path");

class PerformanceMonitor {
  constructor(options = {}) {
    this.options = {
      interval: options.interval || 60000, // 默认1分钟检查一次
      memoryThreshold: options.memoryThreshold || 80, // 默认内存阈值80%
      logToConsole: options.logToConsole !== false,
      logToFile: options.logToFile || false,
      logPath: options.logPath || path.join(process.cwd(), "performance.log"),
    };

    this.intervalId = null;
    this.lastCpuInfo = null;
  }

  start() {
    if (this.intervalId) {
      return this;
    }

    // 初始化CPU信息
    this.lastCpuInfo = os.cpus();

    this.intervalId = setInterval(() => {
      this.checkPerformance();
    }, this.options.interval);

    console.log("Performance monitoring started");
    return this;
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("Performance monitoring stopped");
    }
    return this;
  }

  checkPerformance() {
    const memoryUsage = this.getMemoryUsage();
    const cpuUsage = this.getCpuUsage();
    const timestamp = new Date().toISOString();

    const logMessage = `[${timestamp}] Memory: ${memoryUsage.usedPercent.toFixed(1)}% (${memoryUsage.usedMB}MB/${memoryUsage.totalMB}MB) | CPU: ${cpuUsage.toFixed(1)}%`;

    // 根据配置输出到控制台
    if (this.options.logToConsole) {
      if (memoryUsage.usedPercent > this.options.memoryThreshold) {
        console.warn(`⚠️ ${logMessage} - High memory usage!`);
      } else {
        console.log(logMessage);
      }
    }

    // 根据配置写入文件
    if (this.options.logToFile) {
      fs.appendFile(this.options.logPath, logMessage + "\n", (err) => {
        if (err) console.error("Failed to write performance log:", err);
      });
    }

    // 如果内存使用率超过阈值，尝试垃圾回收
    if (memoryUsage.usedPercent > this.options.memoryThreshold && global.gc) {
      console.log("Attempting garbage collection");
      global.gc();
    }
  }

  getMemoryUsage() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return {
      total: totalMem,
      free: freeMem,
      used: usedMem,
      usedPercent: (usedMem / totalMem) * 100,
      totalMB: Math.round(totalMem / 1024 / 1024),
      usedMB: Math.round(usedMem / 1024 / 1024),
    };
  }

  getCpuUsage() {
    const currentCpuInfo = os.cpus();

    if (!this.lastCpuInfo) {
      this.lastCpuInfo = currentCpuInfo;
      return 0;
    }

    let totalUser = 0;
    let totalSystem = 0;
    let totalIdle = 0;

    for (let i = 0; i < currentCpuInfo.length; i++) {
      const cpu = currentCpuInfo[i];
      const lastCpu = this.lastCpuInfo[i];

      const userDiff = cpu.times.user - lastCpu.times.user;
      const sysDiff = cpu.times.sys - lastCpu.times.sys;
      const idleDiff = cpu.times.idle - lastCpu.times.idle;

      totalUser += userDiff;
      totalSystem += sysDiff;
      totalIdle += idleDiff;
    }

    this.lastCpuInfo = currentCpuInfo;

    const total = totalUser + totalSystem + totalIdle;
    return total > 0 ? ((totalUser + totalSystem) / total) * 100 : 0;
  }
}

module.exports = PerformanceMonitor;
