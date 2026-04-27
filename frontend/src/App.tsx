// 文件说明：React 根组件，维护工具包首页、KIO 编辑器和网络工具占位页的切换。
// 联动 layouts、pages 和 main.tsx。

import { useState } from 'react';
import { AppLayout } from './layouts/AppLayout';
import { KioEditorPage } from './pages/KioEditorPage';
import { AppDialog } from './components/common/AppDialog';
import { WelcomePage } from './pages/WelcomePage';
import { NetworkToolPage } from './pages/NetworkToolPage';

export type ToolKey = 'home' | 'kio' | 'network';

export function App() {
  const [activeTool, setActiveTool] = useState<ToolKey>('home');

  return (
    <>
      <AppLayout activeTool={activeTool} onToolChange={setActiveTool}>
        {activeTool === 'home' && <WelcomePage onOpenTool={setActiveTool} />}
        {activeTool === 'kio' && <KioEditorPage />}
        {activeTool === 'network' && <NetworkToolPage />}
      </AppLayout>
      <AppDialog />
    </>
  );
}
