// 文件说明：领域数据结构定义，描述 Wails API 与前端共享的业务模型。
// 联动 backend/api、frontend/src/features/kio/types 和 Wails 生成绑定。

package domain

type WorkspaceTree struct {
	Projects []ProjectNode `json:"projects"`
}

type ProjectNode struct {
	ID          string        `json:"id"`
	Name        string        `json:"name"`
	Description string        `json:"description"`
	Folders     []FolderNode  `json:"folders"`
	Files       []CsvFileNode `json:"files"`
	CreatedAt   string        `json:"createdAt"`
	UpdatedAt   string        `json:"updatedAt"`
}

type FolderNode struct {
	ID        string        `json:"id"`
	ProjectID string        `json:"projectId"`
	ParentID  string        `json:"parentId"`
	Name      string        `json:"name"`
	PathCache string        `json:"pathCache"`
	Depth     int           `json:"depth"`
	Folders   []FolderNode  `json:"folders"`
	Files     []CsvFileNode `json:"files"`
	CreatedAt string        `json:"createdAt"`
	UpdatedAt string        `json:"updatedAt"`
}

type CsvFileNode struct {
	ID           string `json:"id"`
	ProjectID    string `json:"projectId"`
	FolderID     string `json:"folderId"`
	Name         string `json:"name"`
	ToolType     string `json:"toolType"`
	OriginalPath string `json:"originalPath"`
	InternalPath string `json:"internalPath"`
	Encoding     string `json:"encoding"`
	LineEnding   string `json:"lineEnding"`
	ColumnCount  int    `json:"columnCount"`
	RowCount     int    `json:"rowCount"`
	CreatedAt    string `json:"createdAt"`
	UpdatedAt    string `json:"updatedAt"`
}
