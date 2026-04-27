// 文件说明：顶部栏，展示工具包品牌和顶部工具切换菜单。
// 联动 frontend/src/App.tsx、pages 和全局样式。

import { Box, FileSpreadsheet, Network } from 'lucide-react';
import type { ToolKey } from '../App';

export function Topbar({ activeTool, onToolChange }: { activeTool: ToolKey; onToolChange: (tool: ToolKey) => void }) {
  return (
    <header className="topbar">
      <button className={`top-tool-button brand-button ${activeTool === 'home' ? 'is-active' : ''}`} type="button" onClick={() => onToolChange('home')} title="首页" aria-label="首页">
        <Box size={18} />
        {activeTool === 'home' && <span>便携工具包</span>}
      </button>
      <nav className="top-tool-nav" aria-label="工具菜单">
        <button className={`top-tool-button ${activeTool === 'kio' ? 'is-active' : ''}`} type="button" onClick={() => onToolChange('kio')} title="KIO 变量工具" aria-label="KIO 变量工具">
          <FileSpreadsheet size={17} />
          {activeTool === 'kio' && <span>KIO</span>}
        </button>
        <button className={`top-tool-button ${activeTool === 'network' ? 'is-active' : ''}`} type="button" onClick={() => onToolChange('network')} title="Ping / 端口" aria-label="Ping / 端口">
          <Network size={17} />
          {activeTool === 'network' && <span>Ping / 端口</span>}
        </button>
      </nav>
    </header>
  );
}
