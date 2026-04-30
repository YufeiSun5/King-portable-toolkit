// 文件说明：Wails 前端开发服务脚本，直接用 node 启动 Vite dev server，避免依赖 npm 命令。
// 联动 wails.json、Vite、Wails dev watcher 和 frontend/package.json。

import { spawn } from 'node:child_process';
import { execPath } from 'node:process';

const child = spawn(execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '34215', '--strictPort'], {
  stdio: 'inherit',
  shell: false,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
