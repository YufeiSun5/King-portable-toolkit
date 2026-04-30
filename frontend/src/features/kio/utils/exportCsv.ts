// 文件说明：KIO CSV 导出工具，按完整 KIO 字段顺序生成全量列，并按项目/文件夹/CSV 层级拆分导出文件。
// 联动 KioEditorPage、workspaceStore、kioTableStore 和浏览器下载入口。

import type { CsvNode, FolderNode, ProjectNode, SelectedTreeNode } from '../../workspace/workspaceStore';
import type { KioFieldMetadata, KioVariable } from '../types/kio';
import { isKioNameColumn, sanitizeKioName } from './kioNameRules';
import { readKioCell } from './rowValue';

export type KioExportFile = {
  relativePath: string;
  downloadName: string;
  content: string;
  rowCount: number;
};

const kioExportColumns = [
  'TagID',
  'TagName',
  'Description',
  'TagType',
  'TagDataType',
  'MaxRawValue',
  'MinRawValue',
  'MaxValue',
  'MinValue',
  'NonLinearTableName',
  'ConvertType',
  'IsFilter',
  'DeadBand',
  'Unit',
  'ChannelName',
  'DeviceName',
  'ChannelDriver',
  'DeviceSeries',
  'DeviceSeriesType',
  'CollectControl',
  'CollectInterval',
  'CollectOffset',
  'TimeZoneBias',
  'TimeAdjustment',
  'Enable',
  'ForceWrite',
  'ItemName',
  'RegName',
  'RegType',
  'ItemDataType',
  'ItemAccessMode',
  'HisRecordMode',
  'HisDeadBand',
  'HisInterval',
  'TagGroup',
  'NamespaceIndex',
  'IdentifierType',
  'Identifier',
  'ValueRank',
  'QueueSize',
  'DiscardOldest',
  'MonitoringMode',
  'TriggerMode',
  'DeadType',
  'DeadValue',
  'UANodePath',
  'RedRecordEnable',
  'MqttForwardMode',
  'DAForwardEnable',
  'UAForwardEnable',
  'MqttForwardInterval',
];

export function buildKioExportFiles(rows: KioVariable[], projects: ProjectNode[], selectedNode: SelectedTreeNode, metadata: KioFieldMetadata[]): KioExportFile[] {
  const columns = allExportColumns(metadata);
  const project = projects.find((item) => item.id === selectedNode.projectId);
  if (!project) {
    return [buildSingleFile(selectedNode.name || 'KIO.csv', selectedNode.name || 'KIO.csv', rows, columns)];
  }
  if (selectedNode.type === 'csv') {
    const csv = findCsv(project, selectedNode.id);
    const fileRows = rowsForCsv(rows, selectedNode.id, csv?.name ?? selectedNode.name);
    return [buildSingleFile(csv?.name ?? selectedNode.name, `${project.name}/${csv?.name ?? selectedNode.name}`, fileRows, columns)];
  }
  if (selectedNode.type === 'folder') {
    const folder = findFolder(project.folders, selectedNode.id);
    return folder ? collectFolderExports(folder, [project.name, folder.name], rows, columns) : [];
  }
  return [
    ...project.files.map((file) => buildCsvNodeFile(file, [project.name], rows, columns)),
    ...project.folders.flatMap((folder) => collectFolderExports(folder, [project.name, folder.name], rows, columns)),
  ];
}

function collectFolderExports(folder: FolderNode, pathParts: string[], rows: KioVariable[], columns: string[]): KioExportFile[] {
  return [
    ...folder.files.map((file) => buildCsvNodeFile(file, pathParts, rows, columns)),
    ...folder.folders.flatMap((child) => collectFolderExports(child, [...pathParts, child.name], rows, columns)),
  ];
}

function buildCsvNodeFile(file: CsvNode, pathParts: string[], rows: KioVariable[], columns: string[]) {
  return buildSingleFile(file.name, [...pathParts, file.name].join('/'), rowsForCsv(rows, file.id, file.name), columns);
}

function buildSingleFile(name: string, relativePath: string, rows: KioVariable[], columns: string[]): KioExportFile {
  return {
    relativePath,
    downloadName: sanitizeDownloadName(relativePath || name),
    content: toCsv(rows, columns),
    rowCount: rows.length,
  };
}

function toCsv(rows: KioVariable[], columns: string[]) {
  return [
    columns.join(','),
    ...rows.map((row) => columns.map((columnName) => `"${readKioExportCell(row, columnName).replace(/"/g, '""')}"`).join(',')),
  ].join('\r\n');
}

function allExportColumns(_metadata: KioFieldMetadata[]) {
  return kioExportColumns;
}

function sanitizeDownloadName(relativePath: string) {
  return relativePath.replace(/[\\/:*?"<>|]+/g, '__').replace(/__+/g, '__');
}

function rowsForCsv(rows: KioVariable[], csvId: string, csvName: string) {
  return rows.filter((row) => row.csvFileId === csvId || (row.csvFileId === 'fallback-csv' && csvName === '反应沉淀池B.csv'));
}

function findFolder(folders: FolderNode[], folderId: string): FolderNode | null {
  for (const folder of folders) {
    if (folder.id === folderId) {
      return folder;
    }
    const found = findFolder(folder.folders, folderId);
    if (found) {
      return found;
    }
  }
  return null;
}

function findCsv(project: ProjectNode, csvId: string): CsvNode | null {
  const rootFile = project.files.find((file) => file.id === csvId);
  if (rootFile) {
    return rootFile;
  }
  return findCsvInFolders(project.folders, csvId);
}

function findCsvInFolders(folders: FolderNode[], csvId: string): CsvNode | null {
  for (const folder of folders) {
    const file = folder.files.find((item) => item.id === csvId);
    if (file) {
      return file;
    }
    const found = findCsvInFolders(folder.folders, csvId);
    if (found) {
      return found;
    }
  }
  return null;
}

function readKioExportCell(row: KioVariable, columnName: string) {
  const rawValue = readKioCell(row, columnName);
  if (isKioNameColumn(columnName)) {
    return sanitizeKioName(rawValue || defaultExportValue(row, columnName));
  }
  if (rawValue) {
    return normalizeExportValue(columnName, rawValue);
  }
  return defaultExportValue(row, columnName);
}

function normalizeExportValue(columnName: string, value: string) {
  if (columnName === 'Enable') {
    return value === '1' || value.toLowerCase() === 'true' ? '是' : value === '0' || value.toLowerCase() === 'false' ? '否' : value;
  }
  if (columnName === 'ForceWrite' || columnName === 'CollectControl' || columnName === 'RedRecordEnable' || columnName === 'DAForwardEnable' || columnName === 'UAForwardEnable') {
    return value === '1' || value.toLowerCase() === 'true' ? '是' : value === '0' || value.toLowerCase() === 'false' ? '否' : value;
  }
  if (columnName === 'ItemAccessMode') {
    if (value === 'ReadOnly') {
      return '只读';
    }
    if (value === 'ReadWrite') {
      return '读写';
    }
  }
  if (columnName === 'TagDataType' && value === 'Bool') {
    return 'IODisc';
  }
  if (columnName === 'ChannelDriver' && value === 'S7') {
    return 'S71200Tcp';
  }
  if (columnName === 'RegType' && value === 'BIT') {
    return '3';
  }
  if (columnName === 'HisRecordMode') {
    if (value === '0') {
      return '每次采集记录';
    }
  }
  if (columnName === 'HisInterval' && value === '60000') {
    return '60';
  }
  if (columnName === 'MqttForwardMode') {
    if (value === '0') {
      return '不记录';
    }
  }
  return value;
}

function defaultExportValue(row: KioVariable, columnName: string) {
  const defaults: Record<string, string> = {
    TagType: '用户变量',
    TagDataType: 'IODisc',
    ChannelDriver: 'S71200Tcp',
    DeviceSeries: 'S7-1500',
    DeviceSeriesType: '0',
    CollectControl: '否',
    CollectInterval: '1000',
    CollectOffset: '0',
    TimeZoneBias: '0',
    TimeAdjustment: '0',
    Enable: '是',
    ForceWrite: '否',
    RegName: registerNameFromAddress(row.itemName),
    RegType: '3',
    ItemDataType: 'BIT',
    ItemAccessMode: '只读',
    HisRecordMode: '每次采集记录',
    HisDeadBand: '0',
    HisInterval: '60',
    NamespaceIndex: '0',
    IdentifierType: '0',
    ValueRank: '-1',
    QueueSize: '1',
    DiscardOldest: '0',
    MonitoringMode: '0',
    TriggerMode: '0',
    DeadType: '0',
    DeadValue: '0',
    RedRecordEnable: '否',
    MqttForwardMode: '不记录',
    DAForwardEnable: '否',
    UAForwardEnable: '否',
    MqttForwardInterval: '60',
  };
  return defaults[columnName] ?? '';
}

function registerNameFromAddress(itemName: string) {
  const match = itemName.match(/^([A-Za-z]+)/);
  return match?.[1] ?? '';
}
