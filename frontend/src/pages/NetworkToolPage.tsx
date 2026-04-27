// 文件说明：Ping 和端口检测工具占位页，预留网络诊断工具的页面结构。
// 联动 App、Sidebar 和后续网络诊断实现。

import { Network, RadioTower } from 'lucide-react';

export function NetworkToolPage() {
  return (
    <section className="placeholder-tool-page">
      <div className="placeholder-tool-head">
        <Network size={22} />
        <div>
          <p className="section-title">Ping / 端口</p>
          <h1>网络诊断工具</h1>
          <span>用于现场 IP 连通性和端口可达性检查。</span>
        </div>
      </div>
      <div className="placeholder-tool-body">
        <div className="placeholder-field">
          <label>目标 IP / 域名</label>
          <input value="192.168.1.10" readOnly />
        </div>
        <div className="placeholder-field">
          <label>端口</label>
          <input value="102" readOnly />
        </div>
        <div className="placeholder-result">
          <RadioTower size={18} />
          <span>占位工具，后续接入 Ping、TCP 端口检测和结果历史。</span>
        </div>
      </div>
    </section>
  );
}
