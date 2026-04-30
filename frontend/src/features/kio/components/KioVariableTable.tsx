// 文件说明：KIO 变量表格组件，负责常用/高级字段显示和单元格编辑。
// 联动 backend/api KIO Binding、wailsjs 生成类型和 KIO 页面。

import { useEffect, useMemo, useState } from 'react';
import { Columns3, Copy, Eraser, FilePlus2, PanelTop, Trash2 } from 'lucide-react';
import { useKioTableStore } from '../stores/kioTableStore';
import { useWorkspaceStore } from '../../workspace/workspaceStore';
import { filterRowsByScopeAndSearch } from '../utils/filterRows';
import { ColumnContextMenu } from './context-menu/ColumnContextMenu';
import { RowContextMenu } from './context-menu/RowContextMenu';
import type { RowActionType } from './context-menu/RowContextMenu';
import { useDialogStore } from '../../../stores/dialogStore';

const labels: Record<string, string> = {
  TagID: '变量ID',
  TagName: '变量名',
  Description: '描述',
  TagDataType: '变量类型',
  DeadBand: '采集死区',
  ChannelName: '通道',
  DeviceName: '设备',
  TagGroup: '变量组',
  ItemName: 'PLC地址',
  ItemDataType: '数据类型',
  ItemAccessMode: '读写权限',
  Enable: '启用',
  CollectInterval: '采集周期',
  HisRecordMode: '历史记录',
  HisDeadBand: '存储死区',
  HisInterval: '历史间隔',
};

const rowActionColumn = '__row_actions__';
const rowSelectColumn = '__row_select__';

const widths: Record<string, number> = {
  [rowSelectColumn]: 42,
  [rowActionColumn]: 76,
  TagID: 90,
  TagName: 220,
  Description: 260,
  TagDataType: 130,
  DeadBand: 100,
  ChannelName: 120,
  DeviceName: 150,
  TagGroup: 180,
  ItemName: 130,
  ItemDataType: 110,
  ItemAccessMode: 110,
  Enable: 80,
  CollectInterval: 100,
  HisRecordMode: 110,
  HisDeadBand: 100,
  HisInterval: 100,
};

const variableDataTypeOptions = ['IODisc', 'IOChar', 'IOByte', 'IOShort', 'IOWord', 'IOLong', 'IODWord', 'IOFloat', 'IOString', 'IOBlob', 'IODouble', 'IOInt64'];
const registerDataTypeOptions = ['BIT', 'BYTE', 'SHORT', 'USHORT', 'LONG', 'LONGBCD', 'FLOAT', 'STRING', 'DOUBLE'];
const accessModeOptions = ['只读', '只写', '读写'];
const historyRecordModeOptions = ['每次采集记录', '变化记录', '不记录', '定时记录'];
const yesNoOptions = ['是', '否'];
const numericColumns = new Set([
  'MaxRawValue',
  'MinRawValue',
  'MaxValue',
  'MinValue',
  'DeadBand',
  'CollectInterval',
  'CollectOffset',
  'TimeZoneBias',
  'TimeAdjustment',
  'HisDeadBand',
  'HisInterval',
  'NamespaceIndex',
  'ValueRank',
  'QueueSize',
  'MonitoringMode',
  'TriggerMode',
  'DeadType',
  'DeadValue',
  'MqttForwardInterval',
]);
const selectOptionsByColumn: Record<string, string[]> = {
  TagDataType: variableDataTypeOptions,
  ItemDataType: registerDataTypeOptions,
  ItemAccessMode: accessModeOptions,
  IsFilter: yesNoOptions,
  CollectControl: yesNoOptions,
  Enable: yesNoOptions,
  ForceWrite: yesNoOptions,
  HisRecordMode: historyRecordModeOptions,
  RedRecordEnable: yesNoOptions,
  DAForwardEnable: yesNoOptions,
  UAForwardEnable: yesNoOptions,
  MqttForwardMode: ['不记录'],
};

export function KioVariableTable() {
  const {
    rows,
    selectedRowId,
    manualSelectedRowIds,
    visibleColumns,
    metadata,
    searchText,
    searchConditions,
    selectRow,
    toggleManualRowSelection,
    setManualRowSelection,
    clearManualRowSelection,
    updateCell,
    applyCellValueToColumn,
    applyColumnQuickOperation,
    clearCell,
    showAllFields,
    copyVariable,
    deleteVariable,
    createVariable,
    toggleAllFields,
  } = useKioTableStore();
  const selectedNode = useWorkspaceStore((state) => state.selectedNode);
  const projects = useWorkspaceStore((state) => state.projects);
  const [rowMenu, setRowMenu] = useState<{ rowId: string; x: number; y: number } | null>(null);
  const [cellMenu, setCellMenu] = useState<{ rowId: string; columnName: string; value: string; x: number; y: number } | null>(null);
  const [lastRowAction, setLastRowAction] = useState<RowActionType>('copy');
  const askPairInput = useDialogStore((state) => state.askPairInput);
  const showInfo = useDialogStore((state) => state.showInfo);
  const columns = useMemo(
    () => [rowSelectColumn, rowActionColumn, ...(showAllFields ? fullModeColumns(metadata, visibleColumns) : visibleColumns)],
    [metadata, showAllFields, visibleColumns],
  );
  const columnLabels = useMemo(() => Object.fromEntries(metadata.map((field) => [field.columnName, field.displayName || field.columnName])), [metadata]);
  const visibleRows = useMemo(() => {
    return filterRowsByScopeAndSearch(rows, selectedNode, searchText, projects, searchConditions);
  }, [rows, searchText, selectedNode, projects, searchConditions]);
  const visibleRowIds = useMemo(() => visibleRows.map((row) => row.id), [visibleRows]);
  const manuallySelectedVisibleIds = useMemo(() => manualSelectedRowIds.filter((rowId) => visibleRowIds.includes(rowId)), [manualSelectedRowIds, visibleRowIds]);
  const effectiveRowIds = manuallySelectedVisibleIds.length ? manuallySelectedVisibleIds : visibleRowIds;
  const allVisibleSelected = visibleRows.length > 0 && visibleRows.every((row) => manualSelectedRowIds.includes(row.id));
  const runNumberFill = (direction: 'up' | 'down') => {
    if (!cellMenu) {
      return;
    }
    const plan = buildNumberPlan(cellMenu.value);
    const preview = previewNumberPlan(plan, direction);
    askPairInput({
      title: direction === 'up' ? '编号递增' : '编号递减',
      message: [
        `当前列：${columnLabels[cellMenu.columnName] ?? labels[cellMenu.columnName] ?? cellMenu.columnName}，作用当前可见 ${effectiveRowIds.length} 行。`,
        `取样内容：${cellMenu.value || '当前单元格为空，将只生成编号'}`,
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
        applyColumnQuickOperation(cellMenu.columnName, 'numberFill', {
          numberPrefix: plan.prefix,
          numberSuffix: plan.suffix,
          numberStart: start,
          numberWidth: width,
          numberDirection: direction,
          targetRowIds: effectiveRowIds,
        });
      },
    });
    setCellMenu(null);
  };

  useEffect(() => {
    if (visibleRows.length > 0 && !visibleRows.some((row) => row.id === selectedRowId)) {
      selectRow(visibleRows[0].id);
    }
  }, [selectRow, selectedRowId, visibleRows]);

  return (
    <div
      className="table-wrap"
      onClick={() => {
        setRowMenu(null);
        setCellMenu(null);
      }}
    >
      <table className="kio-table">
        <colgroup>
          {columns.map((column) => (
            <col key={column} style={{ width: widths[column] ?? 150 }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>
                {column === rowSelectColumn ? (
                  <button
                    className={`selection-dot selection-dot-head ${allVisibleSelected ? 'is-checked' : ''}`}
                    title={allVisibleSelected ? '取消选择当前可见行' : '手动选择当前可见行'}
                    aria-label={allVisibleSelected ? '取消选择当前可见行' : '手动选择当前可见行'}
                    onClick={() => {
                      if (allVisibleSelected) {
                        clearManualRowSelection();
                      } else {
                        setManualRowSelection(visibleRowIds);
                      }
                    }}
                  />
                ) : column === rowActionColumn ? (
                  <span className="row-head-label">操作</span>
                ) : (
                  <ColumnContextMenu columnName={column} label={columnLabels[column] ?? labels[column] ?? column} targetRowIds={effectiveRowIds} />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row) => (
            <tr
              key={row.id}
              className={row.id === selectedRowId ? 'is-selected' : ''}
              onClick={() => selectRow(row.id)}
              onContextMenu={(event) => {
                event.preventDefault();
                selectRow(row.id);
                setRowMenu({ rowId: row.id, x: event.clientX, y: event.clientY });
              }}
            >
              {columns.map((column) => (
                <td key={column}>
                  {column === rowSelectColumn ? (
                    <button
                      className={`selection-dot ${manualSelectedRowIds.includes(row.id) ? 'is-checked' : ''}`}
                      title={manualSelectedRowIds.includes(row.id) ? '取消选择变量' : '选择变量'}
                      aria-label={manualSelectedRowIds.includes(row.id) ? '取消选择变量' : '选择变量'}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleManualRowSelection(row.id);
                      }}
                    />
                  ) : column === rowActionColumn ? (
                    <RowContextMenu rowId={row.id} lastAction={lastRowAction} onActionRun={setLastRowAction} />
                  ) : selectOptionsByColumn[column] ? (
                    <select
                      className="editable-cell editable-select"
                      value={readCell(row, column)}
                      onChange={(event) => updateCell(row.id, column, event.target.value)}
                      onFocus={() => selectRow(row.id)}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        selectRow(row.id);
                        setRowMenu(null);
                        setCellMenu({ rowId: row.id, columnName: column, value: readCell(row, column), x: event.clientX, y: event.clientY });
                      }}
                    >
                      {selectValues(column, readCell(row, column)).map((option) => (
                        <option key={option} value={option}>
                          {option || '空'}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="editable-cell"
                      type={numericColumns.has(column) ? 'number' : 'text'}
                      step={numericColumns.has(column) ? 'any' : undefined}
                      value={readCell(row, column)}
                      onChange={(event) => updateCell(row.id, column, event.target.value)}
                      onFocus={() => selectRow(row.id)}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        selectRow(row.id);
                        setRowMenu(null);
                        setCellMenu({ rowId: row.id, columnName: column, value: readCell(row, column), x: event.clientX, y: event.clientY });
                      }}
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rowMenu && (
        <div className="table-context-menu" style={{ left: rowMenu.x, top: rowMenu.y }} onMouseLeave={() => setRowMenu(null)}>
          <button
            onClick={() => {
              setLastRowAction('copy');
              copyVariable(rowMenu.rowId);
              setRowMenu(null);
            }}
          >
            <Copy size={14} />
            复制变量
          </button>
          <button
            onClick={() => {
              setLastRowAction('template');
              createVariable();
              setRowMenu(null);
            }}
          >
            <FilePlus2 size={14} />
            以此为模板新建
          </button>
          <button
            onClick={() => {
              setLastRowAction('toggleFields');
              toggleAllFields();
              setRowMenu(null);
            }}
          >
            <Columns3 size={14} />
            切换全量模式
          </button>
          <button
            className="danger"
            onClick={() => {
              setLastRowAction('delete');
              deleteVariable(rowMenu.rowId);
              setRowMenu(null);
            }}
          >
            <Trash2 size={14} />
            删除变量
          </button>
        </div>
      )}
      {cellMenu && (
        <div className="table-context-menu" style={{ left: cellMenu.x, top: cellMenu.y }} onMouseLeave={() => setCellMenu(null)}>
          <button onClick={() => runNumberFill('up')}>
            <PanelTop size={14} />
            编号递增
          </button>
          <button onClick={() => runNumberFill('down')}>
            <PanelTop size={14} />
            编号递减
          </button>
          <button
            onClick={() => {
              applyCellValueToColumn(cellMenu.rowId, cellMenu.columnName, effectiveRowIds);
              setCellMenu(null);
            }}
          >
            <PanelTop size={14} />
            应用到整列
          </button>
          <button
            onClick={() => {
              void navigator.clipboard?.writeText(cellMenu.value);
              setCellMenu(null);
            }}
          >
            <Copy size={14} />
            复制单元格
          </button>
          <button
            onClick={() => {
              clearCell(cellMenu.rowId, cellMenu.columnName);
              setCellMenu(null);
            }}
          >
            <Eraser size={14} />
            清空单元格
          </button>
        </div>
      )}
    </div>
  );
}

function readCell(row: ReturnType<typeof useKioTableStore.getState>['rows'][number], columnName: string) {
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

function fullModeColumns(metadata: ReturnType<typeof useKioTableStore.getState>['metadata'], visibleColumns: string[]) {
  const columns = metadata.length ? metadata.slice().sort((a, b) => a.sortOrder - b.sortOrder).map((field) => field.columnName) : [...visibleColumns, 'TagType', 'TagDataType', 'ChannelDriver', 'RegName', 'RegType'];
  return Array.from(new Set(columns));
}

function selectValues(columnName: string, currentValue: string) {
  const options = selectOptionsByColumn[columnName] ?? [];
  return currentValue && !options.includes(currentValue) ? [currentValue, '', ...options] : ['', ...options];
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
