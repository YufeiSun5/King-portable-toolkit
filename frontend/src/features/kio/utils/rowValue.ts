// 文件说明：KIO 行字段读取工具，统一从显示字段和扩展字段中取单元格值。
// 联动 filterRows、exportCsv、KioVariableTable 和表格状态仓库。

import type { KioVariable } from '../types/kio';

const displayColumnMap: Record<string, keyof KioVariable> = {
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

export function readKioCell(row: KioVariable, columnName: string) {
  const key = displayColumnMap[columnName];
  if (key && typeof row[key] === 'string') {
    return row[key] as string;
  }
  return row.fields[columnName] ?? '';
}

