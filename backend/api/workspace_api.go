// 文件说明：工作区 API，提供项目树加载、项目创建、重命名和删除的 Wails Binding。
// 联动 backend/domain、backend/database、frontend/wailsjs 和前端调用层。

package api

import (
	"context"
	"database/sql"
	"errors"

	"king-portable-toolkit/backend/database"
	"king-portable-toolkit/backend/domain"
	"king-portable-toolkit/backend/utils"
)

type AppAPI struct {
	ctx context.Context
	db  *database.Database
}

func NewAppAPI(db *database.Database) *AppAPI {
	return &AppAPI{db: db}
}

func (a *AppAPI) Startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *AppAPI) LoadWorkspaceTree() (*domain.WorkspaceTree, error) {
	if err := a.ensureReady(); err != nil {
		return nil, err
	}

	projectRows, err := a.db.Conn().Query(`
		SELECT id, name, COALESCE(description, ''), created_at, updated_at
		FROM projects
		WHERE is_deleted = 0
		ORDER BY sort_order, created_at
	`)
	if err != nil {
		return nil, err
	}
	defer projectRows.Close()

	tree := &domain.WorkspaceTree{Projects: []domain.ProjectNode{}}
	projectIndex := map[string]int{}
	for projectRows.Next() {
		var project domain.ProjectNode
		if err := projectRows.Scan(&project.ID, &project.Name, &project.Description, &project.CreatedAt, &project.UpdatedAt); err != nil {
			return nil, err
		}
		project.Folders = []domain.FolderNode{}
		project.Files = []domain.CsvFileNode{}
		projectIndex[project.ID] = len(tree.Projects)
		tree.Projects = append(tree.Projects, project)
	}
	if err := projectRows.Err(); err != nil {
		return nil, err
	}

	folders, err := a.loadFolders()
	if err != nil {
		return nil, err
	}
	files, err := a.loadCsvFiles()
	if err != nil {
		return nil, err
	}

	foldersByProject := map[string][]domain.FolderNode{}
	for _, folder := range buildFolderTree(folders, files) {
		foldersByProject[folder.ProjectID] = append(foldersByProject[folder.ProjectID], folder)
	}
	rootFilesByProject := map[string][]domain.CsvFileNode{}
	for _, file := range files {
		if file.FolderID == "" {
			rootFilesByProject[file.ProjectID] = append(rootFilesByProject[file.ProjectID], file)
		}
	}
	for projectID, index := range projectIndex {
		tree.Projects[index].Folders = foldersByProject[projectID]
		if tree.Projects[index].Folders == nil {
			tree.Projects[index].Folders = []domain.FolderNode{}
		}
		tree.Projects[index].Files = rootFilesByProject[projectID]
		if tree.Projects[index].Files == nil {
			tree.Projects[index].Files = []domain.CsvFileNode{}
		}
	}
	return tree, nil
}

func (a *AppAPI) loadFolders() ([]domain.FolderNode, error) {
	rows, err := a.db.Conn().Query(`
		SELECT id, project_id, parent_id, name, COALESCE(path_cache, ''), depth, created_at, updated_at
		FROM folders
		WHERE is_deleted = 0
		ORDER BY depth, sort_order, created_at
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	folders := []domain.FolderNode{}
	for rows.Next() {
		var folder domain.FolderNode
		var parentID sql.NullString
		if err := rows.Scan(&folder.ID, &folder.ProjectID, &parentID, &folder.Name, &folder.PathCache, &folder.Depth, &folder.CreatedAt, &folder.UpdatedAt); err != nil {
			return nil, err
		}
		if parentID.Valid {
			folder.ParentID = parentID.String
		}
		folder.Folders = []domain.FolderNode{}
		folder.Files = []domain.CsvFileNode{}
		folders = append(folders, folder)
	}
	return folders, rows.Err()
}

func (a *AppAPI) loadCsvFiles() ([]domain.CsvFileNode, error) {
	rows, err := a.db.Conn().Query(`
		SELECT id, project_id, folder_id, name, tool_type, COALESCE(original_path, ''), COALESCE(internal_path, ''),
			COALESCE(encoding, ''), COALESCE(line_ending, ''), COALESCE(column_count, 0), COALESCE(row_count, 0),
			created_at, updated_at
		FROM csv_files
		WHERE is_deleted = 0
		ORDER BY created_at
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	files := []domain.CsvFileNode{}
	for rows.Next() {
		var file domain.CsvFileNode
		if err := rows.Scan(
			&file.ID,
			&file.ProjectID,
			&file.FolderID,
			&file.Name,
			&file.ToolType,
			&file.OriginalPath,
			&file.InternalPath,
			&file.Encoding,
			&file.LineEnding,
			&file.ColumnCount,
			&file.RowCount,
			&file.CreatedAt,
			&file.UpdatedAt,
		); err != nil {
			return nil, err
		}
		files = append(files, file)
	}
	return files, rows.Err()
}

func buildFolderTree(folders []domain.FolderNode, files []domain.CsvFileNode) []domain.FolderNode {
	fileByFolder := map[string][]domain.CsvFileNode{}
	for _, file := range files {
		fileByFolder[file.FolderID] = append(fileByFolder[file.FolderID], file)
	}

	childrenByParent := map[string][]domain.FolderNode{}
	roots := []domain.FolderNode{}
	for _, folder := range folders {
		folder.Files = fileByFolder[folder.ID]
		if folder.Files == nil {
			folder.Files = []domain.CsvFileNode{}
		}
		if folder.ParentID == "" {
			roots = append(roots, folder)
			continue
		}
		childrenByParent[folder.ParentID] = append(childrenByParent[folder.ParentID], folder)
	}

	var attach func(folder domain.FolderNode) domain.FolderNode
	attach = func(folder domain.FolderNode) domain.FolderNode {
		children := childrenByParent[folder.ID]
		folder.Folders = make([]domain.FolderNode, 0, len(children))
		for _, child := range children {
			folder.Folders = append(folder.Folders, attach(child))
		}
		if folder.Files == nil {
			folder.Files = []domain.CsvFileNode{}
		}
		return folder
	}

	for index, root := range roots {
		roots[index] = attach(root)
	}
	return roots
}

func (a *AppAPI) CreateProject(name string, description string) (*domain.ProjectNode, error) {
	if err := a.ensureReady(); err != nil {
		return nil, err
	}
	if name == "" {
		return nil, errors.New("project name is required")
	}

	now := utils.NowText()
	project := &domain.ProjectNode{
		ID:          utils.NewID(),
		Name:        name,
		Description: description,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	_, err := a.db.Conn().Exec(`
		INSERT INTO projects (id, name, description, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?)
	`, project.ID, project.Name, project.Description, project.CreatedAt, project.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return project, nil
}

func (a *AppAPI) RenameProject(projectID string, newName string) error {
	if err := a.ensureReady(); err != nil {
		return err
	}
	_, err := a.db.Conn().Exec(`
		UPDATE projects SET name = ?, updated_at = ? WHERE id = ? AND is_deleted = 0
	`, newName, utils.NowText(), projectID)
	return err
}

func (a *AppAPI) DeleteProject(projectID string) error {
	if err := a.ensureReady(); err != nil {
		return err
	}
	_, err := a.db.Conn().Exec(`
		UPDATE projects SET is_deleted = 1, updated_at = ? WHERE id = ?
	`, utils.NowText(), projectID)
	return err
}

func (a *AppAPI) ensureReady() error {
	if a == nil || a.db == nil {
		return errors.New("database is not initialized")
	}
	return nil
}
