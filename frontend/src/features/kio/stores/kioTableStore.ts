// 文件说明：KIO 表格状态仓库，维护变量行、选中行、可见列和本地编辑。
// 联动 backend/api KIO Binding、wailsjs 生成类型和 KIO 页面。

import { create } from 'zustand';
import { loadFieldMetadataSafe, loadKioProjectSafe } from '../../../utils/wails';
import { nextBitAddress } from '../../../utils/table';
import type { KioFieldMetadata, KioVariable } from '../types/kio';
import { findInvalidKioNameChars, isKioNameColumn, kioNameInvalidCharsText, sanitizeKioName } from '../utils/kioNameRules';

export type SearchCondition = {
  id: string;
  columnName: string;
  operator: 'equals' | 'like';
  value: string;
};

export type KioSaveHistoryEntry = {
  id: string;
  title: string;
  createdAt: string;
  scopeName: string;
  deviceAddress?: string;
  rows: KioVariable[];
};

type KioTableState = {
  rows: KioVariable[];
  savedRows: KioVariable[];
  saveHistory: KioSaveHistoryEntry[];
  selectedRowId: string;
  manualSelectedRowIds: string[];
  visibleColumns: string[];
  metadata: KioFieldMetadata[];
  showAllFields: boolean;
  searchText: string;
  searchConditions: SearchCondition[];
  lastAction: string;
  isDirty: boolean;
  loadMetadata: () => Promise<void>;
  loadCsvRows: (csvFileId: string) => Promise<void>;
  selectRow: (rowId: string) => void;
  toggleManualRowSelection: (rowId: string) => void;
  setManualRowSelection: (rowIds: string[]) => void;
  clearManualRowSelection: () => void;
  updateCell: (rowId: string, columnName: string, value: string) => void;
  applyCellValueToColumn: (rowId: string, columnName: string, targetRowIds?: string[]) => void;
  clearCell: (rowId: string, columnName: string) => void;
  createVariable: () => void;
  copyVariable: (rowId?: string) => void;
  copyVariablesToFolder: (rowIds: string[], target: { projectId: string; folderId: string; csvFileId: string; folderName: string }) => void;
  importRows: (rows: KioVariable[], sourceName: string) => void;
  deleteVariable: (rowId?: string) => void;
  applyColumnQuickOperation: (columnName: string, operationType: string, options?: ColumnOperationOptions) => void;
  setColumnVisible: (columnName: string, visible: boolean) => void;
  setSearchText: (value: string) => void;
  addSearchCondition: (condition: Omit<SearchCondition, 'id'>) => void;
  removeSearchCondition: (conditionId: string) => void;
  clearSearchConditions: () => void;
  toggleAllFields: () => void;
  markSaved: (title?: string, scopeName?: string, snapshotRows?: KioVariable[], deviceAddress?: string) => void;
  validateRows: (targetRows?: KioVariable[]) => { errors: string[]; warnings: string[] };
  exportCsvText: () => string;
};

type ColumnOperationOptions = {
  value?: string;
  findText?: string;
  replaceText?: string;
  template?: string;
  numberPrefix?: string;
  numberSuffix?: string;
  numberStart?: number;
  numberWidth?: number;
  numberDirection?: 'up' | 'down';
  targetRowIds?: string[];
};

const defaultColumns = [
  'TagID',
  'TagName',
  'Description',
  'TagDataType',
  'ChannelName',
  'DeviceName',
  'TagGroup',
  'ItemName',
  'ItemDataType',
  'ItemAccessMode',
  'Enable',
  'CollectInterval',
  'HisRecordMode',
  'HisInterval',
];

const sampleRows: KioVariable[] = Array.from({ length: 12 }, (_, index) => {
  const no = String(index + 1).padStart(2, '0');
  return {
    id: `row-${no}`,
    projectId: 'fallback-project',
    folderId: 'fallback-folder-2',
    csvFileId: 'fallback-csv',
    tagId: '',
    tagName: `反应B_东阀岛2_远程东沉${no}`,
    description: `反应沉淀池B阀门远程状态${no}`,
    channelName: 'COM1',
    deviceName: '反应沉淀池B',
    tagGroup: '反应沉淀池B/东阀岛',
    itemName: `DB103.${1 + Math.floor(index / 8)}.${index % 8}`,
    itemDataType: 'BIT',
    itemAccessMode: 'ReadOnly',
    enable: '1',
    collectInterval: '1000',
    hisRecordMode: '0',
    hisInterval: '60000',
    fields: {
      TagType: 'IO',
      TagDataType: 'IODisc',
      ChannelDriver: 'S7',
      RegName: 'DB',
      RegType: 'BIT',
      NamespaceIndex: '',
      MqttForwardMode: '0',
    },
  };
});

function cloneVariableRows(rows: KioVariable[]) {
  return rows.map((row) => ({ ...row, fields: { ...row.fields } }));
}

const localRowsKey = 'king-portable-toolkit.kio-rows.v1';
const localSaveHistoryKey = 'king-portable-toolkit.kio-save-history.v1';
const initialRows = loadLocalRows();
const initialSaveHistory = loadLocalSaveHistory();

export const useKioTableStore = create<KioTableState>((set, get) => ({
  rows: initialRows,
  savedRows: cloneVariableRows(initialRows),
  saveHistory: initialSaveHistory,
  selectedRowId: initialRows[0]?.id ?? '',
  manualSelectedRowIds: [],
  visibleColumns: defaultColumns,
  metadata: [],
  showAllFields: false,
  searchText: '',
  searchConditions: [],
  lastAction: '已加载示例 KIO CSV',
  isDirty: false,
  loadMetadata: async () => {
    const metadata = await loadFieldMetadataSafe();
    set({ metadata: metadata as KioFieldMetadata[] });
  },
  loadCsvRows: async (csvFileId) => {
    const project = await loadKioProjectSafe(csvFileId);
    if (!project) {
      return;
    }
    const variables = (project.variables ?? []) as Array<KioVariable & { rowIndex?: number; projectId?: string; folderId?: string }>;
    const rows = normalizeRows(
      variables.map((variable) => ({
        ...variable,
        projectId: variable.projectId ?? project.csvFile?.projectId ?? '',
        folderId: variable.folderId ?? project.csvFile?.folderId ?? '',
        csvFileId,
        fields: variable.fields ?? {},
      })),
    );
    set((state) => ({
      rows: [...state.rows.filter((row) => row.csvFileId !== csvFileId), ...rows],
      savedRows: [...state.savedRows.filter((row) => row.csvFileId !== csvFileId), ...cloneVariableRows(rows)],
      selectedRowId: rows[0]?.id ?? state.selectedRowId,
      manualSelectedRowIds: [],
      lastAction: rows.length ? `已从数据库加载 ${project.csvFile?.name ?? 'CSV'}：${rows.length} 个变量` : `数据库中 ${project.csvFile?.name ?? 'CSV'} 暂无变量`,
      isDirty: false,
    }));
  },
  selectRow: (selectedRowId) => set({ selectedRowId }),
  toggleManualRowSelection: (rowId) =>
    set((state) => ({
      manualSelectedRowIds: state.manualSelectedRowIds.includes(rowId)
        ? state.manualSelectedRowIds.filter((item) => item !== rowId)
        : [...state.manualSelectedRowIds, rowId],
      lastAction: state.manualSelectedRowIds.includes(rowId) ? '已取消手动选择变量' : '已手动选择变量',
    })),
  setManualRowSelection: (manualSelectedRowIds) => set({ manualSelectedRowIds, lastAction: manualSelectedRowIds.length ? `已手动选择 ${manualSelectedRowIds.length} 个变量` : '已清空手动选择' }),
  clearManualRowSelection: () => set({ manualSelectedRowIds: [], lastAction: '已清空手动选择' }),
  updateCell: (rowId, columnName, value) =>
    set((state) => {
      const nextValue = normalizeCellInput(columnName, value);
      return {
        rows: state.rows.map((row) =>
          row.id === rowId
            ? {
                ...row,
                fields: { ...row.fields, [columnName]: nextValue },
                ...mapDisplayColumn(columnName, nextValue),
              }
            : row,
        ),
        lastAction: nextValue === value ? `已编辑 ${columnName}` : `已按 KIO 限制移除变量名无效字符：${kioNameInvalidCharsText}`,
        isDirty: true,
      };
    }),
  applyCellValueToColumn: (rowId, columnName, targetRowIds) =>
    set((state) => {
      const source = state.rows.find((row) => row.id === rowId);
      if (!source) {
        return { lastAction: '没有可应用的单元格' };
      }
      const value = readCell(source, columnName);
      const targetIds = targetRowIds ? new Set(targetRowIds) : null;
      const affectedCount = targetIds?.size ?? state.rows.length;
      if (affectedCount === 0) {
        return { lastAction: '当前筛选结果为空，未应用到整列' };
      }
      return {
        rows: state.rows.map((row) => (!targetIds || targetIds.has(row.id) ? patchCell(row, columnName, value) : row)),
        lastAction: `已将 ${columnName}=${value || '空值'} 应用到当前可见 ${affectedCount} 行`,
        isDirty: true,
      };
    }),
  clearCell: (rowId, columnName) =>
    set((state) => ({
      rows: state.rows.map((row) => (row.id === rowId ? patchCell(row, columnName, '') : row)),
      lastAction: `已清空 ${columnName} 单元格`,
      isDirty: true,
    })),
  createVariable: () =>
    set((state) => {
      const row = createVariableFromTemplate(state.rows[state.rows.length - 1], state.rows.length);
      return {
        rows: [...state.rows, row],
        selectedRowId: row.id,
        lastAction: `已新建变量 ${row.tagName}`,
        isDirty: true,
      };
    }),
  copyVariable: (rowId) =>
    set((state) => {
      const sourceID = rowId || state.selectedRowId;
      const source = state.rows.find((row) => row.id === sourceID);
      if (!source) {
        return { lastAction: '没有可复制的变量' };
      }
      const sourceIndex = state.rows.findIndex((row) => row.id === sourceID);
      const copy = copyVariableRow(source, state.rows.length);
      const nextRows = [...state.rows];
      nextRows.splice(sourceIndex + 1, 0, copy);
      return {
        rows: nextRows,
        selectedRowId: copy.id,
        manualSelectedRowIds: [],
        lastAction: `已复制变量 ${source.tagName}`,
        isDirty: true,
      };
    }),
  copyVariablesToFolder: (rowIds, target) =>
    set((state) => {
      const targetIds = new Set(rowIds);
      const sources = state.rows.filter((row) => targetIds.has(row.id));
      if (sources.length === 0) {
        return { lastAction: '没有可复制到文件夹的变量' };
      }
      const copies = sources.map((source, index) => copyVariableRowToFolder(source, state.rows.length + index, target));
      return {
        rows: [...state.rows, ...copies],
        selectedRowId: copies[0]?.id ?? state.selectedRowId,
        manualSelectedRowIds: [],
        lastAction: `已复制 ${copies.length} 个变量到 ${target.folderName}`,
        isDirty: true,
      };
    }),
  importRows: (rows, sourceName) =>
    set((state) => {
      const nextRows = [...state.rows.filter((row) => row.csvFileId !== rows[0]?.csvFileId), ...rows];
      saveLocalRows(nextRows);
      return {
        rows: nextRows,
        savedRows: [...state.savedRows.filter((row) => row.csvFileId !== rows[0]?.csvFileId), ...cloneVariableRows(rows)],
        selectedRowId: rows[0]?.id ?? state.selectedRowId,
        manualSelectedRowIds: [],
        lastAction: `已导入 ${sourceName}：${rows.length} 个变量`,
        isDirty: true,
      };
    }),
  deleteVariable: (rowId) =>
    set((state) => {
      const targetID = rowId || state.selectedRowId;
      const target = state.rows.find((row) => row.id === targetID);
      const rows = state.rows.filter((row) => row.id !== targetID);
      return {
        rows,
        selectedRowId: rows[0]?.id ?? '',
        manualSelectedRowIds: state.manualSelectedRowIds.filter((item) => item !== targetID),
        lastAction: target ? `已删除变量 ${target.tagName}` : '没有可删除的变量',
        isDirty: Boolean(target),
      };
    }),
  applyColumnQuickOperation: (columnName, operationType, options) =>
    set((state) => {
      const targetCount = options?.targetRowIds?.length ?? state.rows.length;
      if (targetCount === 0) {
        return { lastAction: '当前筛选结果为空，未执行列操作' };
      }
      return {
        rows: applyColumnOperation(state.rows, columnName, operationType, options),
        lastAction: `已对当前可见 ${targetCount} 行执行列操作：${columnName}`,
        isDirty: true,
      };
    }),
  setColumnVisible: (columnName, visible) =>
    set((state) => ({
      visibleColumns: visible
        ? Array.from(new Set([...state.visibleColumns, columnName]))
        : state.visibleColumns.filter((item) => item !== columnName),
      lastAction: visible ? `已显示列 ${columnName}` : `已隐藏列 ${columnName}`,
    })),
  setSearchText: (searchText) => set({ searchText, lastAction: searchText ? `正在搜索：${searchText}` : '已清空搜索' }),
  addSearchCondition: (condition) =>
    set((state) => ({
      searchConditions: [...state.searchConditions, { ...condition, id: `condition-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }],
      lastAction: `已添加筛选：${condition.columnName} ${condition.operator === 'equals' ? '=' : '包含'} ${condition.value}`,
    })),
  removeSearchCondition: (conditionId) =>
    set((state) => ({
      searchConditions: state.searchConditions.filter((condition) => condition.id !== conditionId),
      lastAction: '已移除筛选条件',
    })),
  clearSearchConditions: () => set({ searchConditions: [], lastAction: '已清空筛选条件' }),
  toggleAllFields: () =>
    set((state) => ({
      showAllFields: !state.showAllFields,
      lastAction: state.showAllFields ? '已切换到简洁模式' : '已切换到全量模式',
    })),
  markSaved: (title = '保存当前文件', scopeName = '当前选中层级', snapshotRows, deviceAddress) => {
    const { rows } = get();
    const restoreRows = snapshotRows ?? rows;
    const entry: KioSaveHistoryEntry = {
      id: `save-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      createdAt: new Date().toISOString(),
      scopeName,
      deviceAddress,
      rows: cloneVariableRows(restoreRows),
    };
    saveLocalRows(rows);
    set((state) => {
      const saveHistory = [entry, ...state.saveHistory].slice(0, 30);
      saveLocalSaveHistory(saveHistory);
      return { savedRows: cloneVariableRows(rows), saveHistory, isDirty: false, lastAction: '已保存，当前没有未保存变动' };
    });
  },
  validateRows: (targetRows) => {
    const rows = targetRows ?? get().rows;
    const tagNames = new Map<string, number>();
    const itemNames = new Map<string, number>();
    const errors: string[] = [];
    const warnings: string[] = [];

    rows.forEach((row, index) => {
      const rowNo = index + 1;
      if (!row.tagName.trim()) {
        errors.push(`第 ${rowNo} 行变量名为空`);
      }
      validateKioNameField(errors, rowNo, '变量名', row.tagName);
      validateKioNameField(errors, rowNo, '通道', row.channelName);
      validateKioNameField(errors, rowNo, '设备', row.deviceName);
      if (!row.itemName.trim()) {
        errors.push(`第 ${rowNo} 行 PLC 地址为空`);
      }
      if (!row.deviceName.trim()) {
        errors.push(`第 ${rowNo} 行设备为空`);
      }
      tagNames.set(row.tagName, (tagNames.get(row.tagName) ?? 0) + 1);
      itemNames.set(row.itemName, (itemNames.get(row.itemName) ?? 0) + 1);
      if (row.tagId.trim()) {
        warnings.push(`第 ${rowNo} 行 TagID 未清空`);
      }
    });

    for (const [tagName, count] of tagNames) {
      if (tagName && count > 1) {
        errors.push(`变量名重复：${tagName}`);
      }
    }
    for (const [itemName, count] of itemNames) {
      if (itemName && count > 1) {
        warnings.push(`PLC 地址重复：${itemName}`);
      }
    }
    return { errors, warnings };
  },
  exportCsvText: () => {
    const { rows } = get();
    return [
      defaultColumns.join(','),
      ...rows.map((row) =>
        defaultColumns
          .map((columnName) => `"${readCell(row, columnName).replace(/"/g, '""')}"`)
          .join(','),
      ),
    ].join('\r\n');
  },
}));

function mapDisplayColumn(columnName: string, value: string): Partial<KioVariable> {
  const map: Record<string, keyof KioVariable> = {
    TagID: 'tagId',
    TagName: 'tagName',
    Description: 'description',
    ChannelName: 'channelName',
    DeviceName: 'deviceName',
    TagGroup: 'tagGroup',
    ItemName: 'itemName',
    ItemDataType: 'itemDataType',
    ItemAccessMode: 'itemAccessMode',
    Enable: 'enable',
    CollectInterval: 'collectInterval',
    HisRecordMode: 'hisRecordMode',
    HisInterval: 'hisInterval',
  };
  const key = map[columnName];
  return key ? ({ [key]: value } as Partial<KioVariable>) : {};
}

function applyColumnOperation(rows: KioVariable[], columnName: string, operationType: string, options: ColumnOperationOptions = {}) {
  const targetIds = options.targetRowIds ? new Set(options.targetRowIds) : null;
  const patchTargets = (patchValue: (row: KioVariable, scopedIndex: number) => string) => {
    let scopedIndex = 0;
    return rows.map((row) => {
      if (targetIds && !targetIds.has(row.id)) {
        return row;
      }
      const value = patchValue(row, scopedIndex);
      scopedIndex += 1;
      return patchCell(row, columnName, value);
    });
  };

  if (operationType === 'clear') {
    return patchTargets(() => '');
  }
  if (operationType === 'autoFill') {
    if (options.value === undefined) {
      return rows;
    }
    return patchTargets(() => options.value ?? '');
  }
  if (operationType === 'replace') {
    if (!options.findText) {
      return rows;
    }
    return patchTargets((row) => readCell(row, columnName).split(options.findText ?? '').join(options.replaceText ?? ''));
  }
  if (operationType === 'addPrefix') {
    if (options.value === undefined) {
      return rows;
    }
    return patchTargets((row) => `${options.value ?? ''}${readCell(row, columnName)}`);
  }
  if (operationType === 'numberFill') {
    if (options.numberPrefix === undefined && !options.template) {
      return rows;
    }
    const start = Number.isFinite(options.numberStart) ? options.numberStart ?? 1 : 1;
    const width = Math.max(1, options.numberWidth ?? 2);
    const direction = options.numberDirection === 'down' ? -1 : 1;
    if (options.template) {
      return patchTargets((row, index) => options.template?.replace('{NN}', String(start + index * direction).padStart(width, '0')) ?? readCell(row, columnName));
    }
    return patchTargets((_row, index) => {
      const nextNumber = start + index * direction;
      return `${options.numberPrefix ?? ''}${String(nextNumber).padStart(width, '0')}${options.numberSuffix ?? ''}`;
    });
  }
  if (operationType === 'addressFill') {
    return patchTargets((_row, index) => nextBitAddress(103, 1, 0, index));
  }
  return rows;
}

function patchCell(row: KioVariable, columnName: string, value: string): KioVariable {
  const nextValue = normalizeCellInput(columnName, value);
  return {
    ...row,
    fields: { ...row.fields, [columnName]: nextValue },
    ...mapDisplayColumn(columnName, nextValue),
  };
}

function normalizeCellInput(columnName: string, value: string) {
  return isKioNameColumn(columnName) ? sanitizeKioName(value) : value;
}

function validateKioNameField(errors: string[], rowNo: number, label: string, value: string) {
  const invalidChars = findInvalidKioNameChars(value);
  if (invalidChars.length > 0) {
    errors.push(`第 ${rowNo} 行${label}包含 KIO 无效字符：${invalidChars.join(' ')}；禁止字符：${kioNameInvalidCharsText}`);
  }
}

function readCell(row: KioVariable, columnName: string) {
  const mapped = mapDisplayColumn(columnName, '');
  const key = Object.keys(mapped)[0] as keyof KioVariable | undefined;
  if (key && typeof row[key] === 'string') {
    return row[key] as string;
  }
  return row.fields[columnName] ?? '';
}

function createVariableFromTemplate(template: KioVariable | undefined, index: number): KioVariable {
  const no = String(index + 1).padStart(2, '0');
  if (!template) {
    return {
      id: `row-${Date.now()}`,
      projectId: 'fallback-project',
      folderId: 'fallback-folder-2',
      csvFileId: 'fallback-csv',
      tagId: '',
      tagName: `新变量${no}`,
      description: '',
      channelName: '',
      deviceName: '',
      tagGroup: '',
      itemName: nextBitAddress(103, 1, 0, index),
      itemDataType: 'BIT',
      itemAccessMode: 'ReadOnly',
      enable: '1',
      collectInterval: '1000',
      hisRecordMode: '0',
      hisInterval: '60000',
      fields: { TagDataType: 'IODisc' },
    };
  }
  return {
    ...template,
    id: `row-${Date.now()}`,
    tagId: '',
    tagName: sanitizeKioName(`${template.tagName}_新${no}`),
    description: `${template.description}_新${no}`,
    itemName: nextBitAddress(103, 1, 0, index),
    fields: { ...template.fields, TagID: '' },
  };
}

function copyVariableRow(source: KioVariable, index: number): KioVariable {
  const no = String(index + 1).padStart(2, '0');
  return {
    ...source,
    id: `row-copy-${Date.now()}`,
    tagId: '',
    tagName: sanitizeKioName(`${source.tagName}_副本${no}`),
    description: `${source.description}_副本${no}`,
    fields: { ...source.fields, TagID: '' },
  };
}

function copyVariableRowToFolder(
  source: KioVariable,
  index: number,
  target: { projectId: string; folderId: string; csvFileId: string },
): KioVariable {
  const no = String(index + 1).padStart(2, '0');
  return {
    ...source,
    id: `row-folder-copy-${Date.now()}-${index}`,
    projectId: target.projectId,
    folderId: target.folderId,
    csvFileId: target.csvFileId,
    tagId: '',
    tagName: sanitizeKioName(`${source.tagName}_复制${no}`),
    description: `${source.description}_复制${no}`,
    fields: { ...source.fields, TagID: '' },
  };
}

function loadLocalRows(): KioVariable[] {
  if (typeof window === 'undefined') {
    return cloneVariableRows(sampleRows);
  }
  try {
    const text = window.localStorage.getItem(localRowsKey);
    if (!text) {
      return cloneVariableRows(sampleRows);
    }
    const parsed = JSON.parse(text) as { rows?: KioVariable[] };
    const rows = normalizeRows(parsed.rows ?? []);
    return rows.length ? rows : cloneVariableRows(sampleRows);
  } catch {
    return cloneVariableRows(sampleRows);
  }
}

function saveLocalRows(rows: KioVariable[]) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(localRowsKey, JSON.stringify({ rows: cloneVariableRows(rows) }));
}

function loadLocalSaveHistory(): KioSaveHistoryEntry[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const text = window.localStorage.getItem(localSaveHistoryKey);
    if (!text) {
      return [];
    }
    const parsed = JSON.parse(text) as { entries?: KioSaveHistoryEntry[] };
    return (parsed.entries ?? []).map((entry) => ({
      ...entry,
      rows: cloneVariableRows(normalizeRows(entry.rows ?? [])),
    }));
  } catch {
    return [];
  }
}

function saveLocalSaveHistory(entries: KioSaveHistoryEntry[]) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(localSaveHistoryKey, JSON.stringify({ entries }));
}

function normalizeRows(rows: KioVariable[]) {
  return Array.isArray(rows)
    ? rows.map((row) => ({
        ...row,
        id: row.id ?? `row-local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        projectId: row.projectId ?? '',
        folderId: row.folderId ?? '',
        csvFileId: row.csvFileId ?? '',
        tagId: row.tagId ?? '',
        tagName: sanitizeKioName(row.tagName ?? ''),
        description: row.description ?? '',
        channelName: row.channelName ?? '',
        deviceName: row.deviceName ?? '',
        tagGroup: row.tagGroup ?? '',
        itemName: row.itemName ?? '',
        itemDataType: row.itemDataType ?? '',
        itemAccessMode: row.itemAccessMode ?? '',
        enable: row.enable ?? '',
        collectInterval: row.collectInterval ?? '',
        hisRecordMode: row.hisRecordMode ?? '',
        hisInterval: row.hisInterval ?? '',
        fields: normalizeFields(row.fields ?? {}),
      }))
    : [];
}

function normalizeFields(fields: KioVariable['fields']) {
  const next = { ...fields };
  if (next.TagDataType === 'Bool') {
    next.TagDataType = 'IODisc';
  }
  return next;
}
