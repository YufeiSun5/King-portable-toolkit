// 文件说明：KIO 列头上下文菜单组件，承载批量操作入口。
// 联动 backend/api KIO Binding、wailsjs 生成类型和 KIO 页面。

import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useKioTableStore } from '../../stores/kioTableStore';
import { useDialogStore } from '../../../../stores/dialogStore';
import { readKioCell } from '../../utils/rowValue';

type ColumnContextMenuProps = {
  columnName: string;
  label: string;
  targetRowIds: string[];
};

export function ColumnContextMenu({ columnName, label, targetRowIds }: ColumnContextMenuProps) {
  const [menuPoint, setMenuPoint] = useState<{ x: number; y: number } | null>(null);
  const applyColumnQuickOperation = useKioTableStore((state) => state.applyColumnQuickOperation);
  const rows = useKioTableStore((state) => state.rows);
  const selectedRowId = useKioTableStore((state) => state.selectedRowId);
  const askInput = useDialogStore((state) => state.askInput);
  const askPairInput = useDialogStore((state) => state.askPairInput);
  const askConfirm = useDialogStore((state) => state.askConfirm);
  const showInfo = useDialogStore((state) => state.showInfo);

  const run = (operationType: string) => {
    setMenuPoint(null);
    if (operationType === 'autoFill') {
      askInput({
        title: '自动填充整列',
        message: `将同一个值写入 ${label} 的当前可见 ${targetRowIds.length} 行。`,
        label: '填充值',
        value: '',
        onConfirm: (value) => applyColumnQuickOperation(columnName, operationType, { value, targetRowIds }),
      });
      return;
    }
    if (operationType === 'replace') {
      askPairInput({
        title: '批量替换',
        message: `在 ${label} 当前可见 ${targetRowIds.length} 行中，把匹配文本替换成新内容。例如 A_b：把 _b 替换成 _c，结果为 A_c。`,
        label: '要替换的内容',
        value: '',
        secondaryLabel: '替换成',
        secondaryValue: '',
        confirmText: '执行替换',
        onConfirm: (findText, replaceText) => {
          if (!findText) {
            showInfo({ title: '未执行替换', message: '查找文本不能为空。' });
            return;
          }
          applyColumnQuickOperation(columnName, operationType, { findText, replaceText, targetRowIds });
        },
      });
      return;
    }
    if (operationType === 'addPrefix') {
      askInput({
        title: '添加前缀',
        message: `为 ${label} 当前可见 ${targetRowIds.length} 行追加统一前缀。`,
        label: '前缀',
        value: '',
        onConfirm: (value) => applyColumnQuickOperation(columnName, operationType, { value, targetRowIds }),
      });
      return;
    }
    if (operationType === 'numberFillUp' || operationType === 'numberFillDown') {
      const direction = operationType === 'numberFillDown' ? 'down' : 'up';
      const sample = pickNumberSample(rows, selectedRowId, targetRowIds, columnName);
      const plan = buildNumberPlan(sample);
      const preview = previewNumberPlan(plan, direction);
      askPairInput({
        title: direction === 'up' ? '编号递增' : '编号递减',
        message: [
          `当前列：${label}，作用当前可见 ${targetRowIds.length} 行。`,
          `取样内容：${sample || '当前行为空，将只生成编号'}`,
          `识别结果：保留文字“${plan.prefix}${plan.suffix ? `...${plan.suffix}` : ''}”，编号位数 ${plan.width} 位。`,
          `预览：${preview.join('、')}`,
        ].join('\n'),
        label: '起始编号',
        value: String(plan.start),
        secondaryLabel: '编号位数',
        secondaryValue: String(plan.width),
        confirmText: direction === 'up' ? '递增填充' : '递减填充',
        onConfirm: (startText, widthText) => {
          const start = Number.parseInt(startText, 10);
          const width = Number.parseInt(widthText, 10);
          if (!Number.isFinite(start) || !Number.isFinite(width) || width < 1) {
            showInfo({ title: '未执行编号', message: '起始编号和编号位数必须是有效数字。' });
            return;
          }
          applyColumnQuickOperation(columnName, 'numberFill', {
            numberPrefix: plan.prefix,
            numberSuffix: plan.suffix,
            numberStart: start,
            numberWidth: width,
            numberDirection: direction,
            targetRowIds,
          });
        },
      });
      return;
    }
    if (operationType === 'clear') {
      askConfirm({
        title: '清空整列',
        message: `确认清空 ${label} 当前可见 ${targetRowIds.length} 行的值？`,
        kind: 'danger',
        confirmText: '清空',
        onConfirm: () => applyColumnQuickOperation(columnName, operationType, { targetRowIds }),
      });
      return;
    }
    applyColumnQuickOperation(columnName, operationType, { targetRowIds });
  };

  const openMenu = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPoint({ x: rect.right - 138, y: rect.bottom + 4 });
  };

  return (
    <div
      className="column-head"
      title={`列操作：${columnName}`}
      onContextMenu={openMenu}
    >
      <span>{label}</span>
      <button className="column-menu-button" aria-label={`${label} 列菜单`} title={`${label} 列菜单`} onClick={openMenu}>
        <MoreHorizontal size={14} />
      </button>
      {menuPoint && (
        <div className="column-menu" style={{ left: menuPoint.x, top: menuPoint.y }} onMouseLeave={() => setMenuPoint(null)}>
          <button onClick={() => run('autoFill')}>自动填充</button>
          <button onClick={() => run('replace')}>批量替换</button>
          <button onClick={() => run('addPrefix')}>添加前缀</button>
          <button onClick={() => run('clear')}>清空整列</button>
          <button onClick={() => run('numberFillUp')}>编号递增</button>
          <button onClick={() => run('numberFillDown')}>编号递减</button>
          <button onClick={() => run('addressFill')}>BIT地址递增</button>
        </div>
      )}
    </div>
  );
}

function pickNumberSample(
  rows: ReturnType<typeof useKioTableStore.getState>['rows'],
  selectedRowId: string,
  targetRowIds: string[],
  columnName: string,
) {
  const targetSet = new Set(targetRowIds);
  const selected = rows.find((row) => row.id === selectedRowId && targetSet.has(row.id));
  const firstTarget = rows.find((row) => targetSet.has(row.id));
  const sampleRow = selected ?? firstTarget ?? rows[0];
  return sampleRow ? readKioCell(sampleRow, columnName) : '';
}

function buildNumberPlan(sample: string) {
  const match = sample.match(/^(.*?)(\d+)(\D*)$/);
  if (!match) {
    return {
      prefix: sample,
      suffix: '',
      start: 1,
      width: 2,
    };
  }
  return {
    prefix: match[1],
    suffix: match[3],
    start: Number.parseInt(match[2], 10),
    width: match[2].length,
  };
}

function previewNumberPlan(plan: ReturnType<typeof buildNumberPlan>, direction: 'up' | 'down') {
  const step = direction === 'down' ? -1 : 1;
  return [0, 1, 2].map((index) => `${plan.prefix}${String(plan.start + index * step).padStart(plan.width, '0')}${plan.suffix}`);
}
