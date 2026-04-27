// 文件说明：领域数据结构定义，描述 Wails API 与前端共享的业务模型。
// 联动 backend/api、frontend/src/features/kio/types 和 Wails 生成绑定。

package domain

type CreateRule struct {
	TemplateVariableID  string      `json:"templateVariableId"`
	NameTemplate        string      `json:"nameTemplate"`
	DescriptionTemplate string      `json:"descriptionTemplate"`
	DeviceName          string      `json:"deviceName"`
	ChannelName         string      `json:"channelName"`
	TagGroup            string      `json:"tagGroup"`
	ItemDataType        string      `json:"itemDataType"`
	ItemAccessMode      string      `json:"itemAccessMode"`
	Count               int         `json:"count"`
	AddressRule         AddressRule `json:"addressRule"`
}

type CreatePreview struct {
	Variables []KioVariable `json:"variables"`
}
