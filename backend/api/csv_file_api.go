// 文件说明：CSV 功能节点 API，负责在项目树中创建、重命名和删除 CSV 记录。
// 联动 workspace_api、SQLite csv_files 表、前端 workspaceStore 和 Wails Binding。

package api

import (
	"errors"

	"king-portable-toolkit/backend/constants"
	"king-portable-toolkit/backend/domain"
	"king-portable-toolkit/backend/utils"
)

func (a *AppAPI) CreateCsvFile(projectID string, folderID string, name string) (*domain.CsvFileNode, error) {
	if err := a.ensureReady(); err != nil {
		return nil, err
	}
	if projectID == "" || name == "" {
		return nil, errors.New("project id and csv name are required")
	}

	now := utils.NowText()
	file := &domain.CsvFileNode{
		ID:          utils.NewID(),
		ProjectID:   projectID,
		FolderID:    folderID,
		Name:        name,
		ToolType:    constants.ToolTypeKIO,
		Encoding:    "GB18030",
		LineEnding:  "CRLF",
		ColumnCount: len(constants.KioFieldMetadata()),
		RowCount:    0,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	_, err := a.db.Conn().Exec(`
		INSERT INTO csv_files (
			id, project_id, folder_id, name, tool_type, original_path, internal_path,
			encoding, line_ending, column_count, row_count, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, file.ID, file.ProjectID, file.FolderID, file.Name, file.ToolType, "", "", file.Encoding, file.LineEnding, file.ColumnCount, file.RowCount, file.CreatedAt, file.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return file, nil
}

func (a *AppAPI) RenameCsvFile(csvFileID string, newName string) error {
	if err := a.ensureReady(); err != nil {
		return err
	}
	_, err := a.db.Conn().Exec(`
		UPDATE csv_files SET name = ?, updated_at = ? WHERE id = ? AND is_deleted = 0
	`, newName, utils.NowText(), csvFileID)
	return err
}

func (a *AppAPI) DeleteCsvFile(csvFileID string) error {
	if err := a.ensureReady(); err != nil {
		return err
	}
	_, err := a.db.Conn().Exec(`
		UPDATE csv_files SET is_deleted = 1, updated_at = ? WHERE id = ?
	`, utils.NowText(), csvFileID)
	return err
}
