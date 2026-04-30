// 文件说明：Vite 构建配置，配合 Wails 前端构建和开发模式。
// 联动 package.json、wails.json 和 Wails 前端构建。

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    host: '127.0.0.1',
    port: 34215,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 34215,
    strictPort: true,
  },
});
