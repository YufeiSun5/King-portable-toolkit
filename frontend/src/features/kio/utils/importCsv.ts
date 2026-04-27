// 文件说明：KIO CSV 导入工具，解析 CSV/TSV 文本并转换为前端变量行。
// 联动 KioEditorPage、kioTableStore、workspaceStore 和浏览器文件选择器。

import type { KioVariable } from '../types/kio';

export type ImportedKioCsv = {
  rows: KioVariable[];
  headers: string[];
};

const displayFieldMap: Record<string, keyof KioVariable> = {
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

export function parseKioCsvText(text: string, scope: { projectId: string; folderId: string; csvFileId: string }): ImportedKioCsv {
  const lines = text.replace(/^\uFEFF/, '').split(/\r\n|\n|\r/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return { rows: [], headers: [] };
  }
  const delimiter = detectDelimiter(lines[0]);
  const headers = parseDelimitedLine(lines[0], delimiter).map(cleanHeader);
  const rows = lines.slice(1).map((line, index) => rowFromValues(headers, parseDelimitedLine(line, delimiter), scope, index));
  return { headers, rows };
}

export async function readTextFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return decodeKioText(buffer);
}

function rowFromValues(headers: string[], values: string[], scope: { projectId: string; folderId: string; csvFileId: string }, index: number): KioVariable {
  const fields = Object.fromEntries(headers.map((header, headerIndex) => [header, values[headerIndex] ?? '']));
  const row: KioVariable = {
    id: `row-import-${scope.csvFileId}-${Date.now()}-${index}`,
    projectId: scope.projectId,
    folderId: scope.folderId,
    csvFileId: scope.csvFileId,
    tagId: '',
    tagName: '',
    description: '',
    channelName: '',
    deviceName: '',
    tagGroup: '',
    itemName: '',
    itemDataType: '',
    itemAccessMode: '',
    enable: '',
    collectInterval: '',
    hisRecordMode: '',
    hisInterval: '',
    fields,
  };
  headers.forEach((header) => {
    const key = displayFieldMap[header];
    if (key) {
      row[key] = fields[header] as never;
    }
  });
  return row;
}

function decodeKioText(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return new TextDecoder('utf-8').decode(bytes).replace(/^\uFEFF/, '');
  }
  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder('utf-16le').decode(bytes).replace(/^\uFEFF/, '');
  }
  const utf8 = new TextDecoder('utf-8').decode(bytes);
  if (!utf8.includes('\uFFFD')) {
    return utf8;
  }
  return new TextDecoder('gb18030').decode(bytes);
}

function detectDelimiter(headerLine: string) {
  const commaCount = countDelimiter(headerLine, ',');
  const tabCount = countDelimiter(headerLine, '\t');
  return tabCount > commaCount ? '\t' : ',';
}

function countDelimiter(line: string, delimiter: string) {
  let count = 0;
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      index += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === delimiter && !quoted) {
      count += 1;
    }
  }
  return count;
}

function cleanHeader(header: string) {
  return header.trim().replace(/^"|"$/g, '').trim();
}

function parseDelimitedLine(line: string, delimiter: string) {
  const values: string[] = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === delimiter && !quoted) {
      values.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  values.push(current);
  return values;
}
