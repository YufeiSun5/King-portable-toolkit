// 文件说明：右侧变量详情面板，展示当前选中变量的分组快编字段。
// 联动 workspaceStore、kioTableStore、KIO 表格和全局样式。

import { useMemo } from 'react';
import { useKioTableStore } from '../features/kio/stores/kioTableStore';

const groups = [
  ['基础信息', ['TagID', 'TagName', 'Description', 'TagType', 'TagDataType']],
  ['设备通讯', ['ChannelName', 'DeviceName', 'ChannelDriver']],
  ['PLC地址', ['ItemName', 'RegName', 'RegType', 'ItemDataType', 'ItemAccessMode']],
  ['采集与历史', ['Enable', 'CollectInterval', 'HisRecordMode', 'HisInterval']],
] as const;

const names: Record<string, string> = {
  TagID: '变量ID',
  TagName: '变量名',
  Description: '描述',
  TagType: '变量类型',
  TagDataType: '变量数据类型',
  ChannelName: '通道',
  DeviceName: '设备',
  ChannelDriver: '通道驱动',
  ItemName: 'PLC地址',
  RegName: '寄存器名',
  RegType: '寄存器类型',
  ItemDataType: '地址数据类型',
  ItemAccessMode: '读写权限',
  Enable: '启用',
  CollectInterval: '采集周期',
  HisRecordMode: '历史记录方式',
  HisInterval: '历史间隔',
};

export function RightPanel() {
  const { rows, selectedRowId, updateCell } = useKioTableStore();
  const row = useMemo(() => rows.find((item) => item.id === selectedRowId), [rows, selectedRowId]);

  if (!row) {
    return <aside className="right-panel" />;
  }

  const valueOf = (columnName: string) =>
    row.fields[columnName] ??
    ({
      TagID: row.tagId,
      TagName: row.tagName,
      Description: row.description,
      ChannelName: row.channelName,
      DeviceName: row.deviceName,
      ItemName: row.itemName,
      ItemDataType: row.itemDataType,
      ItemAccessMode: row.itemAccessMode,
      Enable: row.enable,
      CollectInterval: row.collectInterval,
      HisRecordMode: row.hisRecordMode,
      HisInterval: row.hisInterval,
    }[columnName] ||
      '');

  return (
    <aside className="right-panel">
      {groups.map(([title, fields]) => (
        <section className="right-section" key={title}>
          <p className="section-title">{title}</p>
          <div className="field-grid">
            {fields.map((field) => (
              <div className="field-row" key={field}>
                <label htmlFor={`detail-${field}`}>{names[field] ?? field}</label>
                <input
                  id={`detail-${field}`}
                  value={valueOf(field)}
                  onChange={(event) => updateCell(row.id, field, event.target.value)}
                />
              </div>
            ))}
          </div>
        </section>
      ))}
    </aside>
  );
}
