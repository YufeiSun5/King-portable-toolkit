// 文件说明：KIO 名称规则工具，集中处理 KIO 原软件不允许的名称字符。
// 联动 kioTableStore、exportCsv 和变量表格输入，避免导出后 KIO 拒绝导入。

export const kioNameInvalidCharsText = `,;:+/*%&!.~|^<>=$[]{}:"'\\?`;
export const kioNameColumns = ['TagName', 'ChannelName', 'DeviceName'];

const kioNameInvalidCharPattern = /[,;:+\/*%&!.~|^<>=$[\]{}:"'\\?]/g;
const kioNameInvalidCharTestPattern = /[,;:+\/*%&!.~|^<>=$[\]{}:"'\\?]/;

export function sanitizeKioName(value: string) {
  return value.replace(kioNameInvalidCharPattern, '').trim();
}

export function findInvalidKioNameChars(value: string) {
  return Array.from(new Set(value.match(kioNameInvalidCharPattern) ?? []));
}

export function hasInvalidKioNameChars(value: string) {
  return kioNameInvalidCharTestPattern.test(value);
}

export function isKioNameColumn(columnName: string) {
  return kioNameColumns.includes(columnName);
}
