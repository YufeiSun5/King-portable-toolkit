// 文件说明：KIO 导出文件请求与结果结构，承接前端生成的 CSV 文本并交给后端按 GB18030 写盘。
// 联动 backend/api/export_file_api.go、frontend/src/utils/wails.ts 和 KioEditorPage。

package domain

type KioExportFileRequest struct {
	RelativePath string `json:"relativePath"`
	DownloadName string `json:"downloadName"`
	Content      string `json:"content"`
}

type KioExportFileResult struct {
	RelativePath string `json:"relativePath"`
	FilePath     string `json:"filePath"`
	RowCount     int    `json:"rowCount"`
}
