// 文件说明：Wails 前端生产构建脚本，直接用 node 执行 tsc 和 vite，避免依赖 npm 命令。
// 联动 wails.json、TypeScript、Vite 和 frontend/package.json。

import { spawnSync } from 'node:child_process';
import { execPath } from 'node:process';

run('node_modules/typescript/bin/tsc');
run('node_modules/vite/bin/vite.js', ['build']);

function run(script, args = []) {
  const result = spawnSync(execPath, [script, ...args], { stdio: 'inherit', shell: false });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
