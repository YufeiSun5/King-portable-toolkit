// 文件说明：领域数据结构定义，描述 Wails API 与前端共享的业务模型。
// 联动 backend/api、frontend/src/features/kio/types 和 Wails 生成绑定。

package domain

type ColumnOperation struct {
	CsvFileID     string         `json:"csvFileId"`
	ColumnName    string         `json:"columnName"`
	OperationType string         `json:"operationType"`
	Scope         OperationScope `json:"scope"`
	Value         string         `json:"value"`
	FindText      string         `json:"findText"`
	ReplaceText   string         `json:"replaceText"`
	Prefix        string         `json:"prefix"`
	Suffix        string         `json:"suffix"`
	NumberStart   int            `json:"numberStart"`
	NumberStep    int            `json:"numberStep"`
	NumberWidth   int            `json:"numberWidth"`
	Template      string         `json:"template"`
	AddressRule   *AddressRule   `json:"addressRule"`
}

type OperationScope struct {
	Type            string   `json:"type"`
	SelectedRowIDs  []string `json:"selectedRowIds"`
	FilterCondition string   `json:"filterCondition"`
}

type AddressRule struct {
	AddressType string `json:"addressType"`
	DBNumber    int    `json:"dbNumber"`
	ByteStart   int    `json:"byteStart"`
	BitStart    int    `json:"bitStart"`
	Step        int    `json:"step"`
}

type OperationPreview struct {
	AffectedCount int             `json:"affectedCount"`
	ColumnName    string          `json:"columnName"`
	OperationType string          `json:"operationType"`
	Before        []PreviewSample `json:"before"`
	After         []PreviewSample `json:"after"`
}

type PreviewSample struct {
	RowID string `json:"rowId"`
	Value string `json:"value"`
}

type OperationResult struct {
	AffectedCount int    `json:"affectedCount"`
	ChangeLogID   string `json:"changeLogId"`
}
