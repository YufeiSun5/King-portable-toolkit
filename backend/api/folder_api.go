// 文件说明：文件夹 API，提供项目内无限层级文件夹的创建、重命名和删除入口。
// 联动 backend/domain、backend/database、frontend/wailsjs 和前端调用层。

package api

import (
	"errors"

	"king-portable-toolkit/backend/domain"
	"king-portable-toolkit/backend/utils"
)

func (a *AppAPI) CreateFolder(projectID string, parentFolderID string, name string) (*domain.FolderNode, error) {
	if err := a.ensureReady(); err != nil {
		return nil, err
	}
	if projectID == "" || name == "" {
		return nil, errors.New("project id and folder name are required")
	}

	now := utils.NowText()
	folder := &domain.FolderNode{
		ID:        utils.NewID(),
		ProjectID: projectID,
		ParentID:  parentFolderID,
		Name:      name,
		CreatedAt: now,
		UpdatedAt: now,
	}

	_, err := a.db.Conn().Exec(`
		INSERT INTO folders (id, project_id, parent_id, name, path_cache, depth, created_at, updated_at)
		VALUES (?, ?, NULLIF(?, ''), ?, ?, ?, ?, ?)
	`, folder.ID, folder.ProjectID, folder.ParentID, folder.Name, folder.Name, folder.Depth, folder.CreatedAt, folder.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return folder, nil
}

func (a *AppAPI) RenameFolder(folderID string, newName string) error {
	if err := a.ensureReady(); err != nil {
		return err
	}
	_, err := a.db.Conn().Exec(`
		UPDATE folders SET name = ?, updated_at = ? WHERE id = ? AND is_deleted = 0
	`, newName, utils.NowText(), folderID)
	return err
}

func (a *AppAPI) DeleteFolder(folderID string) error {
	if err := a.ensureReady(); err != nil {
		return err
	}
	_, err := a.db.Conn().Exec(`
		UPDATE folders SET is_deleted = 1, updated_at = ? WHERE id = ?
	`, utils.NowText(), folderID)
	return err
}
