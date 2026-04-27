// 文件说明：Wails 前端依赖检查脚本，在缺少 npm 的 vfox Node 环境中避免直接调用 npm。
// 联动 wails.json、frontend/package.json、Vite 和 TypeScript 本地依赖。

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const requiredFiles = [
  'node_modules/typescript/bin/tsc',
  'node_modules/vite/bin/vite.js',
];

const missing = requiredFiles.filter((file) => !existsSync(resolve(file)));

if (missing.length > 0) {
  console.error('frontend/node_modules 不完整，当前 vfox Node SDK 又没有 npm.cmd，无法自动安装依赖。');
  console.error('缺失文件：');
  for (const file of missing) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log('frontend dependencies are ready.');
