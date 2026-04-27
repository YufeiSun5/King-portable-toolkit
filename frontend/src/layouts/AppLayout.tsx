// 文件说明：应用主布局，组合顶部工具栏、KIO 工作区树和主内容区。
// 联动 frontend/src/App.tsx、pages 和全局样式。

import type { ReactNode } from 'react';
import type { ToolKey } from '../App';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';

export function AppLayout({ activeTool, onToolChange, children }: { activeTool: ToolKey; onToolChange: (tool: ToolKey) => void; children: ReactNode }) {
  return (
    <div className="app-shell">
      <Topbar activeTool={activeTool} onToolChange={onToolChange} />
      <div className={`workspace ${activeTool !== 'kio' ? 'workspace-no-sidebar' : ''}`}>
        {activeTool === 'kio' && <Sidebar />}
        <main className="main-panel">{children}</main>
      </div>
    </div>
  );
}
