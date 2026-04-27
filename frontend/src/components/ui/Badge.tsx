// 文件说明：徽标组件，用于展示工具状态、数据库状态等轻量信息。
// 联动 layouts、pages、features 和全局样式。

import type { ReactNode } from 'react';

export function Badge({ children }: { children: ReactNode }) {
  return <span className="badge">{children}</span>;
}

