// 文件说明：领域数据结构定义，描述 Wails API 与前端共享的业务模型。
// 联动 backend/api、frontend/src/features/kio/types 和 Wails 生成绑定。

package domain

type ValidateReport struct {
	Errors   []ValidateItem `json:"errors"`
	Warnings []ValidateItem `json:"warnings"`
	Infos    []ValidateItem `json:"infos"`
}

type ValidateItem struct {
	Level      string `json:"level"`
	Code       string `json:"code"`
	Message    string `json:"message"`
	VariableID string `json:"variableId"`
	ColumnName string `json:"columnName"`
}
