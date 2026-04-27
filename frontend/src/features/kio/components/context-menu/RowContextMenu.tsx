// 文件说明：KIO 行操作菜单组件，提供三点菜单和最近一次行操作快捷按钮。
// 联动 KioVariableTable、kioTableStore 和 KIO 变量编辑流程。

import { Columns3, Copy, FilePlus2, MoreHorizontal, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useKioTableStore } from '../../stores/kioTableStore';

export type RowActionType = 'copy' | 'template' | 'toggleFields' | 'delete';

type RowContextMenuProps = {
  rowId: string;
  lastAction: RowActionType;
  onActionRun: (action: RowActionType) => void;
};

const actionMeta: Record<RowActionType, { label: string; icon: ReactNode; danger?: boolean }> = {
  copy: { label: '复制变量', icon: <Copy size={14} /> },
  template: { label: '以此为模板新建', icon: <FilePlus2 size={14} /> },
  toggleFields: { label: '切换全量模式', icon: <Columns3 size={14} /> },
  delete: { label: '删除变量', icon: <Trash2 size={14} />, danger: true },
};

export function RowContextMenu({ rowId, lastAction, onActionRun }: RowContextMenuProps) {
  const [menuPoint, setMenuPoint] = useState<{ x: number; y: number } | null>(null);
  const { copyVariable, deleteVariable, createVariable, selectRow, toggleAllFields } = useKioTableStore();

  const run = (actionType: RowActionType) => {
    selectRow(rowId);
    onActionRun(actionType);
    if (actionType === 'copy') {
      copyVariable(rowId);
    }
    if (actionType === 'template') {
      createVariable();
    }
    if (actionType === 'toggleFields') {
      toggleAllFields();
    }
    if (actionType === 'delete') {
      deleteVariable(rowId);
    }
    setMenuPoint(null);
  };
  const quickAction = actionMeta[lastAction];

  return (
    <div className="row-menu-host">
      <button
        className={`row-quick-button ${quickAction.danger ? 'danger' : ''}`}
        type="button"
        title={`重复操作：${quickAction.label}`}
        aria-label={`重复操作：${quickAction.label}`}
        onClick={(event) => {
          event.stopPropagation();
          run(lastAction);
        }}
      >
        {quickAction.icon}
      </button>
      <button
        className="row-menu-button"
        aria-label="变量行菜单"
        title="变量行菜单"
        onClick={(event) => {
          event.stopPropagation();
          const rect = event.currentTarget.getBoundingClientRect();
          setMenuPoint((point) => (point ? null : { x: rect.left, y: rect.bottom + 4 }));
        }}
      >
        <MoreHorizontal size={14} />
      </button>
      {menuPoint && (
        <div className="row-menu" style={{ left: menuPoint.x, top: menuPoint.y }} onMouseLeave={() => setMenuPoint(null)}>
          {Object.entries(actionMeta).map(([actionType, meta]) => (
            <button className={meta.danger ? 'danger' : ''} key={actionType} onClick={() => run(actionType as RowActionType)}>
              {meta.icon}
              {meta.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
