// 文件说明：KIO 前端领域类型定义，与 Go 后端变量和字段元数据结构对齐。
// 联动 backend/api KIO Binding、wailsjs 生成类型和 KIO 页面。

export type KioFieldMetadata = {
  columnName: string;
  displayName: string;
  fieldGroup: string;
  isCommon: boolean;
  description: string;
  example: string;
  editorType: string;
  sortOrder: number;
};

export type KioVariable = {
  id: string;
  projectId?: string;
  folderId?: string;
  csvFileId?: string;
  tagId: string;
  tagName: string;
  description: string;
  channelName: string;
  deviceName: string;
  tagGroup: string;
  itemName: string;
  itemDataType: string;
  itemAccessMode: string;
  enable: string;
  collectInterval: string;
  hisRecordMode: string;
  hisInterval: string;
  fields: Record<string, string>;
};

export type ColumnOperationType =
  | 'autoFill'
  | 'replace'
  | 'addPrefix'
  | 'addSuffix'
  | 'clear'
  | 'numberFill'
  | 'addressFill';
