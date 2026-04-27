// 文件说明：KIO 批量操作类型定义，与 Go 后端 ColumnOperation 结构对齐。
// 联动 backend/api KIO Binding、wailsjs 生成类型和 KIO 页面。

export type OperationScopeType = 'all' | 'filtered' | 'selected' | 'empty' | 'duplicated';

export type OperationScope = {
  type: OperationScopeType;
  selectedRowIds: string[];
  filterCondition: string;
};

export type AddressRule = {
  addressType: 'BIT' | 'BYTE' | 'WORD' | 'DWORD';
  dbNumber: number;
  byteStart: number;
  bitStart: number;
  step: number;
};

export type ColumnOperation = {
  csvFileId: string;
  columnName: string;
  operationType: string;
  scope: OperationScope;
  value?: string;
  findText?: string;
  replaceText?: string;
  prefix?: string;
  suffix?: string;
  numberStart?: number;
  numberStep?: number;
  numberWidth?: number;
  template?: string;
  addressRule?: AddressRule;
};

