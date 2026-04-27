// 文件说明：应用级状态仓库，维护当前工具和跨页面状态。
// 联动同目录模块和上层调用方。

import { create } from 'zustand';

type AppState = {
  activeTool: 'kio';
};

export const useAppStore = create<AppState>(() => ({
  activeTool: 'kio',
}));

