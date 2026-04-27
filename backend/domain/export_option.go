// 文件说明：领域数据结构定义，描述 Wails API 与前端共享的业务模型。
// 联动 backend/api、frontend/src/features/kio/types 和 Wails 生成绑定。

package domain

type ExportOption struct {
	Mode                 string `json:"mode"`
	TargetPath           string `json:"targetPath"`
	Encoding             string `json:"encoding"`
	LineEnding           string `json:"lineEnding"`
	ValidateBeforeExport bool   `json:"validateBeforeExport"`
}

type ExportResult struct {
	Path          string `json:"path"`
	Encoding      string `json:"encoding"`
	LineEnding    string `json:"lineEnding"`
	VariableCount int    `json:"variableCount"`
}
