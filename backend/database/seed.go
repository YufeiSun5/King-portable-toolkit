// 文件说明：数据库种子数据初始化，写入 KIO 字段元数据等基础配置。
// 联动 backend/constants、backend/api、SQLite 工作区和 MEMORY 记录。

package database

import (
	"database/sql"

	"king-portable-toolkit/backend/constants"
	"king-portable-toolkit/backend/utils"
)

func (d *Database) Seed() error {
	for _, field := range constants.KioFieldMetadata() {
		_, err := d.conn.Exec(
			`INSERT INTO kio_field_metadata (
				column_name, display_name, field_group, is_common, description, example, editor_type, sort_order
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
			ON CONFLICT(column_name) DO UPDATE SET
				display_name = excluded.display_name,
				field_group = excluded.field_group,
				is_common = excluded.is_common,
				description = excluded.description,
				example = excluded.example,
				editor_type = excluded.editor_type,
				sort_order = excluded.sort_order`,
			field.ColumnName,
			field.DisplayName,
			field.FieldGroup,
			boolToInt(field.IsCommon),
			field.Description,
			field.Example,
			field.EditorType,
			field.SortOrder,
		)
		if err != nil {
			return err
		}
	}
	return d.seedDemoWorkspace()
}

func boolToInt(value bool) int {
	if value {
		return 1
	}
	return 0
}

func (d *Database) seedDemoWorkspace() error {
	var count int
	if err := d.conn.QueryRow(`SELECT COUNT(1) FROM projects WHERE is_deleted = 0`).Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	now := utils.NowText()
	projectID := utils.NewID()
	folderAID := utils.NewID()
	folderBID := utils.NewID()
	csvID := utils.NewID()

	return d.WithTx(func(tx *sql.Tx) error {
		if _, err := tx.Exec(`
			INSERT INTO projects (id, name, description, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?)
		`, projectID, "示例项目 - KIO变量生成器", "用于开发模式验证项目树、文件夹和 CSV 节点。", now, now); err != nil {
			return err
		}
		if _, err := tx.Exec(`
			INSERT INTO folders (id, project_id, parent_id, name, path_cache, depth, created_at, updated_at)
			VALUES (?, ?, NULL, ?, ?, 0, ?, ?)
		`, folderAID, projectID, "一期工程", "一期工程", now, now); err != nil {
			return err
		}
		if _, err := tx.Exec(`
			INSERT INTO folders (id, project_id, parent_id, name, path_cache, depth, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, 1, ?, ?)
		`, folderBID, projectID, folderAID, "反应沉淀池", "一期工程/反应沉淀池", now, now); err != nil {
			return err
		}
		_, err := tx.Exec(`
			INSERT INTO csv_files (
				id, project_id, folder_id, name, tool_type, original_path, internal_path,
				encoding, line_ending, column_count, row_count, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`, csvID, projectID, folderBID, "反应沉淀池B.csv", constants.ToolTypeKIO, "", "", "GB18030", "CRLF", 51, 12, now, now)
		return err
	})
}
