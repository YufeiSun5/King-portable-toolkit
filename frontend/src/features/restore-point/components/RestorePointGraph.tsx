// 文件说明：还原点图谱页面，用类似 Git 历史图的方式展示当前选中层级的快照节点。
// 联动 KioEditorPage、全局样式和后续后端还原点服务。

import { X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import type { Ref } from 'react';
import type { KioSaveHistoryEntry } from '../../kio/stores/kioTableStore';
import type { KioFieldMetadata, KioVariable } from '../../kio/types/kio';

type RestorePointGraphProps = {
  currentName: string;
  currentRows: KioVariable[];
  savedRows: KioVariable[];
  saveHistory: KioSaveHistoryEntry[];
  metadata: KioFieldMetadata[];
  visibleColumns: string[];
  showAllFields: boolean;
  onClose: () => void;
};

const fallbackLabels: Record<string, string> = {
  TagID: '变量ID',
  TagName: '变量名',
  Description: '描述',
  ChannelName: '通道',
  DeviceName: '设备',
  TagGroup: '变量组',
  ItemName: 'PLC地址',
  ItemDataType: '数据类型',
  ItemAccessMode: '读写权限',
  Enable: '启用',
  CollectInterval: '采集周期',
  HisRecordMode: '历史记录',
  HisInterval: '历史间隔',
};

type DiffKind = 'same' | 'added' | 'deleted' | 'modified';

type DiffRow = {
  key: string;
  current?: KioVariable;
  restore?: KioVariable;
  rowKind: DiffKind;
};

export function RestorePointGraph({ currentName, currentRows, savedRows, saveHistory, metadata, visibleColumns, showAllFields, onClose }: RestorePointGraphProps) {
  const currentScrollRef = useRef<HTMLDivElement | null>(null);
  const restoreScrollRef = useRef<HTMLDivElement | null>(null);
  const syncingRef = useRef(false);
  const columns = useMemo(() => buildColumns(metadata, visibleColumns, showAllFields), [metadata, showAllFields, visibleColumns]);
  const columnLabels = useMemo(() => Object.fromEntries(metadata.map((field) => [field.columnName, field.displayName || field.columnName])), [metadata]);
  const restorePoints = useMemo(() => buildRestorePoints(saveHistory, savedRows), [saveHistory, savedRows]);
  const [selectedId, setSelectedId] = useState('');
  const selected = restorePoints.find((point) => point.id === selectedId) ?? restorePoints[0];
  const restoreRows = selected?.rows ?? [];
  const diffRows = useMemo(() => buildDiffRows(currentRows, restoreRows), [currentRows, restoreRows]);
  const widths = useMemo(() => buildColumnWidths(columns, columnLabels, diffRows), [columns, columnLabels, diffRows]);

  const syncScroll = (source: 'current' | 'restore') => {
    if (syncingRef.current) {
      return;
    }
    const from = source === 'current' ? currentScrollRef.current : restoreScrollRef.current;
    const to = source === 'current' ? restoreScrollRef.current : currentScrollRef.current;
    if (!from || !to) {
      return;
    }
    syncingRef.current = true;
    to.scrollLeft = from.scrollLeft;
    to.scrollTop = from.scrollTop;
    window.requestAnimationFrame(() => {
      syncingRef.current = false;
    });
  };

  return (
    <section className="restore-panel" aria-label="还原点图谱">
      <div className="restore-page-head">
        <div>
          <p className="section-title">还原点</p>
          <h2>{currentName}</h2>
          <span>只显示当前选中文件或目录下的记录</span>
        </div>
        <button type="button" onClick={onClose}>
          <X size={15} />
          关闭
        </button>
      </div>
      <div className="restore-page-body">
        <div className="restore-graph">
          {restorePoints.length ? (
            restorePoints.map((point) => (
              <button className={`restore-node is-normal ${point.id === selected?.id ? 'is-selected' : ''}`} type="button" key={point.id} onClick={() => setSelectedId(point.id)}>
                <span className="graph-rail is-main">
                  <i />
                </span>
                <span className="restore-copy">
                  <strong>{point.title}</strong>
                  <small>{point.meta}</small>
                </span>
              </button>
            ))
          ) : (
            <div className="restore-empty">
              <strong>当前范围没有保存记录</strong>
              <small>保存当前文件或保存全部后，这里只显示所选文件/文件夹命中的记录。</small>
            </div>
          )}
        </div>
        <div className="restore-compare">
          <RestoreReadonlyTable
            title="当前"
            meta={`${currentName} · ${currentRows.length} 行`}
            rows={diffRows}
            columns={columns}
            columnLabels={columnLabels}
            widths={widths}
            side="current"
            scrollRef={currentScrollRef}
            onScroll={() => syncScroll('current')}
          />
          <RestoreReadonlyTable
            title={selected?.title ?? '没有保存记录'}
            meta={selected ? `${selected.meta} · ${restoreRows.length} 行` : '当前选中文件或文件夹还没有可对比的保存快照'}
            rows={diffRows}
            columns={columns}
            columnLabels={columnLabels}
            widths={widths}
            side="restore"
            scrollRef={restoreScrollRef}
            onScroll={() => syncScroll('restore')}
          />
        </div>
      </div>
    </section>
  );
}

function RestoreReadonlyTable({
  title,
  meta,
  rows,
  columns,
  columnLabels,
  widths,
  side,
  scrollRef,
  onScroll,
}: {
  title: string;
  meta: string;
  rows: DiffRow[];
  columns: string[];
  columnLabels: Record<string, string>;
  widths: Record<string, number>;
  side: 'current' | 'restore';
  scrollRef: Ref<HTMLDivElement>;
  onScroll: () => void;
}) {
  return (
    <section className="restore-table-card">
      <div className="restore-table-head">
        <strong>{title}</strong>
        <span>{meta}</span>
      </div>
      <div className="restore-table-scroll" ref={scrollRef} onScroll={onScroll}>
        <table className="restore-readonly-table">
          <colgroup>
            {columns.map((column) => (
              <col key={column} style={{ width: `${widths[column]}ch` }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{columnLabels[column] ?? fallbackLabels[column] ?? column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                {columns.map((column) => {
                  const value = side === 'current' ? readCell(row.current, column) : readCell(row.restore, column);
                  return (
                    <td className={`diff-${cellKind(row, column, side)}`} key={column}>
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function buildColumns(metadata: KioFieldMetadata[], visibleColumns: string[], showAllFields: boolean) {
  if (showAllFields) {
    const metadataColumns = metadata.slice().sort((a, b) => a.sortOrder - b.sortOrder).map((field) => field.columnName);
    return metadataColumns.length ? metadataColumns : [...visibleColumns, 'TagType', 'TagDataType', 'ChannelDriver', 'RegName', 'RegType'];
  }
  return visibleColumns;
}

function buildRestorePoints(saveHistory: KioSaveHistoryEntry[], savedRows: KioVariable[]) {
  const scopedHistory = saveHistory
    .filter((entry) => entry.rows.length > 0)
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      meta: `${formatSaveTime(entry.createdAt)} · ${entry.scopeName} · ${entry.rows.length} 行`,
      rows: entry.rows.map(cloneRow),
    }));
  if (scopedHistory.length) {
    return scopedHistory;
  }
  if (!savedRows.length) {
    return [];
  }
  return [
    {
      id: 'last-saved',
      title: '当前已保存版本',
      meta: `加载时快照 · ${savedRows.length} 行`,
      rows: savedRows.map(cloneRow),
    },
  ];
}

function buildDiffRows(currentRows: KioVariable[], restoreRows: KioVariable[]): DiffRow[] {
  const orderedKeys = Array.from(new Set([...currentRows.map(rowKey), ...restoreRows.map(rowKey)]));
  return orderedKeys.map((key) => {
    const current = currentRows.find((row) => rowKey(row) === key);
    const restore = restoreRows.find((row) => rowKey(row) === key);
    return {
      key,
      current,
      restore,
      rowKind: !restore ? 'added' : !current ? 'deleted' : 'same',
    };
  });
}

function buildColumnWidths(columns: string[], columnLabels: Record<string, string>, rows: DiffRow[]) {
  return Object.fromEntries(
    columns.map((column) => {
      const maxLength = Math.max(
        columnTextLength(columnLabels[column] ?? fallbackLabels[column] ?? column),
        ...rows.flatMap((row) => [columnTextLength(readCell(row.current, column)), columnTextLength(readCell(row.restore, column))]),
      );
      return [column, Math.max(8, maxLength + 2)];
    }),
  );
}

function cellKind(row: DiffRow, column: string, side: 'current' | 'restore'): DiffKind {
  if (row.rowKind === 'added') {
    return side === 'current' ? 'added' : 'same';
  }
  if (row.rowKind === 'deleted') {
    return side === 'restore' ? 'deleted' : 'same';
  }
  return readCell(row.current, column) === readCell(row.restore, column) ? 'same' : 'modified';
}

function readCell(row: KioVariable | undefined, columnName: string) {
  if (!row) {
    return '';
  }
  const values: Record<string, string> = {
    TagID: row.tagId,
    TagName: row.tagName,
    Description: row.description,
    ChannelName: row.channelName,
    DeviceName: row.deviceName,
    TagGroup: row.tagGroup,
    ItemName: row.itemName,
    ItemDataType: row.itemDataType,
    ItemAccessMode: row.itemAccessMode,
    Enable: row.enable,
    CollectInterval: row.collectInterval,
    HisRecordMode: row.hisRecordMode,
    HisInterval: row.hisInterval,
  };
  return values[columnName] ?? row.fields[columnName] ?? '';
}

function cloneRow(row: KioVariable): KioVariable {
  return { ...row, fields: { ...row.fields } };
}

function rowKey(row: KioVariable) {
  return row.id;
}

function columnTextLength(value: string) {
  return Array.from(value).reduce((sum, char) => sum + (char.charCodeAt(0) > 255 ? 2 : 1), 0);
}

function formatSaveTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '保存记录';
  }
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
