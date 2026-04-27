// 文件说明：首页欢迎页，说明便携工具包内置工具和入口用途。
// 联动 App、Sidebar、Topbar 和全局样式。

import { FileSpreadsheet, Network, PlugZap } from 'lucide-react';
import type { ToolKey } from '../App';
import { Button } from '../components/ui/Button';

export function WelcomePage({ onOpenTool }: { onOpenTool: (tool: ToolKey) => void }) {
  return (
    <section className="welcome-page">
      <div className="welcome-head">
        <div>
          <p className="section-title">便携工具包</p>
          <h1>现场调试和工程数据整理工具集合</h1>
          <span>顶部图标可随时回到这里；左侧菜单进入具体工具。</span>
        </div>
      </div>
      <div className="tool-overview">
        <article className="tool-overview-item is-ready">
          <FileSpreadsheet size={22} />
          <div>
            <strong>KIO 变量工具</strong>
            <p>整理 KIO CSV、批量编辑变量、按项目目录导出完整字段，并查看还原点差异。</p>
          </div>
          <Button onClick={() => onOpenTool('kio')}>进入</Button>
        </article>
        <article className="tool-overview-item">
          <Network size={22} />
          <div>
            <strong>Ping / 端口工具</strong>
            <p>预留给 IP 连通性、端口探测和现场网络排查，当前为占位入口。</p>
          </div>
          <Button onClick={() => onOpenTool('network')}>查看</Button>
        </article>
        <article className="tool-overview-item">
          <PlugZap size={22} />
          <div>
            <strong>后续工具位</strong>
            <p>后续可以继续放入串口、协议测试、文件转换等小工具，统一从这里进入。</p>
          </div>
        </article>
      </div>
    </section>
  );
}
