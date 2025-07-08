#!/usr/bin/env node

// 设置环境变量
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// 启动应用
require('./bin/www');