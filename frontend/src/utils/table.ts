// 文件说明：表格工具函数，提供 BIT 地址递增等纯计算能力。
// 联动 KIO store、批量操作预览和后端同名规则。

export function nextBitAddress(dbNumber: number, byteIndex: number, bitIndex: number, offset: number) {
  const totalBits = byteIndex * 8 + bitIndex + offset;
  const nextByte = Math.floor(totalBits / 8);
  const nextBit = totalBits % 8;
  return `DB${dbNumber}.${nextByte}.${nextBit}`;
}

