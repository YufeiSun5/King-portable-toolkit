// 文件说明：领域数据结构定义，描述 Wails API 与前端共享的业务模型。
// 联动 backend/api、frontend/src/features/kio/types 和 Wails 生成绑定。

package domain

type KioProject struct {
	CsvFile   CsvFileNode        `json:"csvFile"`
	Headers   []KioCsvHeader     `json:"headers"`
	Variables []KioVariable      `json:"variables"`
	Fields    []KioFieldValue    `json:"fields"`
	Metadata  []KioFieldMetadata `json:"metadata"`
}

type KioCsvHeader struct {
	ID          string `json:"id"`
	CsvFileID   string `json:"csvFileId"`
	ColumnIndex int    `json:"columnIndex"`
	ColumnName  string `json:"columnName"`
}

type KioVariable struct {
	ID              string            `json:"id"`
	CsvFileID       string            `json:"csvFileId"`
	RowIndex        int               `json:"rowIndex"`
	TagID           string            `json:"tagId"`
	TagName         string            `json:"tagName"`
	Description     string            `json:"description"`
	ChannelName     string            `json:"channelName"`
	DeviceName      string            `json:"deviceName"`
	TagGroup        string            `json:"tagGroup"`
	ItemName        string            `json:"itemName"`
	ItemDataType    string            `json:"itemDataType"`
	ItemAccessMode  string            `json:"itemAccessMode"`
	Enable          string            `json:"enable"`
	CollectInterval string            `json:"collectInterval"`
	HisRecordMode   string            `json:"hisRecordMode"`
	HisInterval     string            `json:"hisInterval"`
	Fields          map[string]string `json:"fields"`
	CreatedAt       string            `json:"createdAt"`
	UpdatedAt       string            `json:"updatedAt"`
}

type KioFieldValue struct {
	ID          string `json:"id"`
	VariableID  string `json:"variableId"`
	ColumnIndex int    `json:"columnIndex"`
	ColumnName  string `json:"columnName"`
	ColumnValue string `json:"columnValue"`
	IsVisible   bool   `json:"isVisible"`
	FieldGroup  string `json:"fieldGroup"`
	UpdatedAt   string `json:"updatedAt"`
}

type KioFieldMetadata struct {
	ColumnName  string `json:"columnName"`
	DisplayName string `json:"displayName"`
	FieldGroup  string `json:"fieldGroup"`
	IsCommon    bool   `json:"isCommon"`
	Description string `json:"description"`
	Example     string `json:"example"`
	EditorType  string `json:"editorType"`
	SortOrder   int    `json:"sortOrder"`
}
