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

const labels: Record<string, string> = {
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

const rowActionColumn = '__row_actions__';
const rowSelectColumn = '__row_select__';

const widths: Record<string, number> = {
  [rowSelectColumn]: 42,
  [rowActionColumn]: 76,
  TagID: 90,
  TagName: 220,
  Description: 260,
  ChannelName: 120,
  DeviceName: 150,
  TagGroup: 180,
  ItemName: 130,
  ItemDataType: 110,
  ItemAccessMode: 110,
  Enable: 80,
  CollectInterval: 100,
  HisRecordMode: 110,
  HisInterval: 100,
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
                  ) : (
                    <input
                      className="editable-cell"
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
