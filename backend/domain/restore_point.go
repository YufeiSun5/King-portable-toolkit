// 文件说明：领域数据结构定义，描述 Wails API 与前端共享的业务模型。
// 联动 backend/api、frontend/src/features/kio/types 和 Wails 生成绑定。

package domain

type RestorePoint struct {
	ID            string `json:"id"`
	ProjectID     string `json:"projectId"`
	Name          string `json:"name"`
	Description   string `json:"description"`
	SnapshotPath  string `json:"snapshotPath"`
	CsvCount      int    `json:"csvCount"`
	VariableCount int    `json:"variableCount"`
	FolderCount   int    `json:"folderCount"`
	ChangeCount   int    `json:"changeCount"`
	CreatedAt     string `json:"createdAt"`
}

type DirtySummary struct {
	ProjectID          string         `json:"projectId"`
	HasDirtyChanges    bool           `json:"hasDirtyChanges"`
	ChangeTypeCounts   map[string]int `json:"changeTypeCounts"`
	LastRestorePointAt string         `json:"lastRestorePointAt"`
}
