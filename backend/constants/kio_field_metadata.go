// 文件说明：KIO 字段元数据常量，定义字段中文名、分组、常用列和编辑器类型。
// 联动 backend/database/seed.go、KIO 前端字段显示和校验逻辑。

package constants

import "king-portable-toolkit/backend/domain"

var CommonKioColumns = []string{
	"TagID",
	"TagName",
	"Description",
	"TagDataType",
	"ChannelName",
	"DeviceName",
	"TagGroup",
	"ItemName",
	"ItemDataType",
	"ItemAccessMode",
	"Enable",
	"CollectInterval",
	"HisRecordMode",
	"HisInterval",
}

func KioFieldMetadata() []domain.KioFieldMetadata {
	return []domain.KioFieldMetadata{
		meta("TagID", "变量ID", "基础信息", true, "变量唯一标识，导出前通常需要按项目规则处理。", "", "text", 10),
		meta("TagName", "变量名", "基础信息", true, "KIO 变量名称，必须非空且建议唯一。", "反应B_东阀岛2_远程01", "text", 20),
		meta("Description", "描述", "基础信息", true, "变量用途说明。", "反应沉淀池阀门远程状态", "text", 30),
		meta("TagType", "变量类型", "基础信息", false, "原始 KIO 字段，默认隐藏但必须保留。", "", "text", 40),
		meta("TagDataType", "变量数据类型", "基础信息", true, "变量值数据类型。", "IODisc", "select", 50),
		meta("MaxRawValue", "原始最大值", "量程转换", false, "原始量程最大值。", "", "number", 60),
		meta("MinRawValue", "原始最小值", "量程转换", false, "原始量程最小值。", "", "number", 70),
		meta("MaxValue", "工程最大值", "量程转换", false, "工程量程最大值。", "", "number", 80),
		meta("MinValue", "工程最小值", "量程转换", false, "工程量程最小值。", "", "number", 90),
		meta("NonLinearTableName", "非线性表", "量程转换", false, "非线性转换表名称。", "", "text", 100),
		meta("ConvertType", "转换方式", "量程转换", false, "数值转换方式。", "", "text", 110),
		meta("IsFilter", "滤波", "采集设置", false, "是否启用滤波。", "", "select", 120),
		meta("DeadBand", "采集死区", "采集设置", false, "采集死区。", "", "number", 130),
		meta("Unit", "单位", "基础信息", false, "工程单位。", "", "text", 140),
		meta("ChannelName", "通道", "设备通讯", true, "通讯通道名称。", "COM1", "text", 150),
		meta("DeviceName", "设备", "设备通讯", true, "设备名称。", "反应沉淀池B", "text", 160),
		meta("ChannelDriver", "通道驱动", "设备通讯", false, "驱动相关高级字段。", "", "text", 170),
		meta("DeviceSeries", "设备系列", "设备通讯", false, "设备系列高级字段。", "", "text", 180),
		meta("DeviceSeriesType", "设备系列类型", "设备通讯", false, "设备系列类型高级字段。", "", "text", 190),
		meta("CollectControl", "采集控制", "采集设置", false, "采集控制策略。", "", "text", 200),
		meta("CollectInterval", "采集周期", "采集设置", true, "采集间隔。", "1000", "number", 210),
		meta("CollectOffset", "采集偏移", "采集设置", false, "采集偏移参数。", "", "number", 220),
		meta("TimeZoneBias", "时区偏移", "采集设置", false, "时区偏移。", "", "number", 230),
		meta("TimeAdjustment", "时间校准", "采集设置", false, "时间校准。", "", "number", 240),
		meta("Enable", "启用", "采集设置", true, "是否启用变量采集。", "1", "select", 250),
		meta("ForceWrite", "强制写入", "采集设置", false, "写入策略高级字段。", "", "select", 260),
		meta("ItemName", "PLC地址", "PLC地址", true, "变量绑定的 PLC 点位地址。", "DB103.1.0", "text", 270),
		meta("RegName", "寄存器名", "PLC地址", false, "地址寄存器名称。", "", "text", 280),
		meta("RegType", "寄存器类型", "PLC地址", false, "地址寄存器类型。", "", "text", 290),
		meta("ItemDataType", "地址数据类型", "PLC地址", true, "PLC 地址数据类型。", "BIT", "select", 300),
		meta("ItemAccessMode", "读写权限", "PLC地址", true, "读写访问模式。", "ReadWrite", "select", 310),
		meta("HisRecordMode", "历史记录方式", "历史记录", true, "历史数据记录模式。", "0", "select", 320),
		meta("HisDeadBand", "存储死区", "历史记录", false, "历史记录死区。", "", "number", 330),
		meta("HisInterval", "历史间隔", "历史记录", true, "历史记录间隔。", "60000", "number", 340),
		meta("TagGroup", "变量组", "变量组", true, "变量分类组。", "反应沉淀池B", "text", 350),
		meta("NamespaceIndex", "命名空间索引", "OPC UA / MQTT / 转发", false, "OPC UA 命名空间索引。", "", "number", 360),
		meta("IdentifierType", "标识类型", "OPC UA / MQTT / 转发", false, "OPC UA 标识类型。", "", "text", 370),
		meta("Identifier", "标识", "OPC UA / MQTT / 转发", false, "OPC UA 标识。", "", "text", 380),
		meta("ValueRank", "值维度", "OPC UA / MQTT / 转发", false, "OPC UA ValueRank。", "", "number", 390),
		meta("QueueSize", "队列长度", "OPC UA / MQTT / 转发", false, "订阅队列长度。", "", "number", 400),
		meta("DiscardOldest", "丢弃旧值", "OPC UA / MQTT / 转发", false, "队列满时是否丢弃旧值。", "", "select", 410),
		meta("MonitoringMode", "监视模式", "OPC UA / MQTT / 转发", false, "OPC UA 监视模式。", "", "number", 420),
		meta("TriggerMode", "触发模式", "OPC UA / MQTT / 转发", false, "触发模式。", "", "number", 430),
		meta("DeadType", "死区类型", "OPC UA / MQTT / 转发", false, "订阅死区类型。", "", "number", 440),
		meta("DeadValue", "死区值", "OPC UA / MQTT / 转发", false, "订阅死区值。", "", "number", 450),
		meta("UANodePath", "UA节点路径", "OPC UA / MQTT / 转发", false, "OPC UA 节点路径。", "", "text", 460),
		meta("RedRecordEnable", "冗余记录", "OPC UA / MQTT / 转发", false, "是否启用冗余记录。", "", "select", 470),
		meta("MqttForwardMode", "MQTT转发模式", "OPC UA / MQTT / 转发", false, "MQTT 转发模式。", "", "select", 480),
		meta("DAForwardEnable", "DA转发", "OPC UA / MQTT / 转发", false, "是否启用 DA 转发。", "", "select", 490),
		meta("UAForwardEnable", "UA转发", "OPC UA / MQTT / 转发", false, "是否启用 UA 转发。", "", "select", 500),
		meta("MqttForwardInterval", "MQTT转发间隔", "OPC UA / MQTT / 转发", false, "MQTT 转发间隔。", "", "number", 510),
	}
}

func meta(columnName, displayName, fieldGroup string, common bool, description, example, editorType string, sortOrder int) domain.KioFieldMetadata {
	return domain.KioFieldMetadata{
		ColumnName:  columnName,
		DisplayName: displayName,
		FieldGroup:  fieldGroup,
		IsCommon:    common,
		Description: description,
		Example:     example,
		EditorType:  editorType,
		SortOrder:   sortOrder,
	}
}
