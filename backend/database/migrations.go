// 文件说明：SQLite 迁移定义，创建项目、文件夹、CSV、KIO 字段、还原点等核心表。
// 联动 backend/constants、backend/api、SQLite 工作区和 MEMORY 记录。

package database

func (d *Database) Migrate() error {
	statements := []string{
		`CREATE TABLE IF NOT EXISTS projects (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			description TEXT,
			sort_order INTEGER DEFAULT 0,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL,
			is_deleted INTEGER DEFAULT 0
		);`,
		`CREATE TABLE IF NOT EXISTS folders (
			id TEXT PRIMARY KEY,
			project_id TEXT NOT NULL,
			parent_id TEXT,
			name TEXT NOT NULL,
			path_cache TEXT,
			depth INTEGER DEFAULT 0,
			sort_order INTEGER DEFAULT 0,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL,
			is_deleted INTEGER DEFAULT 0
		);`,
		`CREATE TABLE IF NOT EXISTS csv_files (
			id TEXT PRIMARY KEY,
			project_id TEXT NOT NULL,
			folder_id TEXT NOT NULL,
			name TEXT NOT NULL,
			tool_type TEXT NOT NULL,
			original_path TEXT,
			internal_path TEXT,
			encoding TEXT,
			line_ending TEXT,
			column_count INTEGER,
			row_count INTEGER,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL,
			is_deleted INTEGER DEFAULT 0
		);`,
		`CREATE TABLE IF NOT EXISTS kio_csv_headers (
			id TEXT PRIMARY KEY,
			csv_file_id TEXT NOT NULL,
			column_index INTEGER NOT NULL,
			column_name TEXT NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS kio_variables (
			id TEXT PRIMARY KEY,
			csv_file_id TEXT NOT NULL,
			row_index INTEGER NOT NULL,
			tag_id TEXT,
			tag_name TEXT,
			description TEXT,
			tag_type TEXT,
			tag_data_type TEXT,
			channel_name TEXT,
			device_name TEXT,
			channel_driver TEXT,
			device_series TEXT,
			device_series_type TEXT,
			tag_group TEXT,
			item_name TEXT,
			reg_name TEXT,
			reg_type TEXT,
			item_data_type TEXT,
			item_access_mode TEXT,
			enable TEXT,
			collect_control TEXT,
			collect_interval TEXT,
			collect_offset TEXT,
			force_write TEXT,
			his_record_mode TEXT,
			his_dead_band TEXT,
			his_interval TEXT,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL,
			is_deleted INTEGER DEFAULT 0
		);`,
		`CREATE TABLE IF NOT EXISTS kio_variable_fields (
			id TEXT PRIMARY KEY,
			variable_id TEXT NOT NULL,
			column_index INTEGER NOT NULL,
			column_name TEXT NOT NULL,
			column_value TEXT,
			is_visible INTEGER DEFAULT 0,
			field_group TEXT,
			updated_at TEXT NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS kio_field_metadata (
			column_name TEXT PRIMARY KEY,
			display_name TEXT,
			field_group TEXT,
			is_common INTEGER DEFAULT 0,
			description TEXT,
			example TEXT,
			editor_type TEXT,
			sort_order INTEGER DEFAULT 0
		);`,
		`CREATE TABLE IF NOT EXISTS change_logs (
			id TEXT PRIMARY KEY,
			project_id TEXT NOT NULL,
			csv_file_id TEXT,
			variable_id TEXT,
			action_type TEXT NOT NULL,
			action_name TEXT NOT NULL,
			target_field TEXT,
			affected_count INTEGER DEFAULT 0,
			detail_json TEXT,
			created_at TEXT NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS restore_points (
			id TEXT PRIMARY KEY,
			project_id TEXT NOT NULL,
			name TEXT NOT NULL,
			description TEXT,
			snapshot_path TEXT NOT NULL,
			csv_count INTEGER DEFAULT 0,
			variable_count INTEGER DEFAULT 0,
			folder_count INTEGER DEFAULT 0,
			change_count INTEGER DEFAULT 0,
			created_at TEXT NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS app_settings (
			key TEXT PRIMARY KEY,
			value TEXT,
			updated_at TEXT NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS table_views (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			tool_type TEXT NOT NULL,
			is_default INTEGER DEFAULT 0,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS table_view_columns (
			id TEXT PRIMARY KEY,
			view_id TEXT NOT NULL,
			column_name TEXT NOT NULL,
			visible INTEGER DEFAULT 1,
			width INTEGER DEFAULT 160,
			pinned TEXT,
			sort_order INTEGER DEFAULT 0
		);`,
	}

	for _, statement := range statements {
		if _, err := d.conn.Exec(statement); err != nil {
			return err
		}
	}
	return nil
}
