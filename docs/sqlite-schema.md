# SQLite Schema

当前迁移位于 `backend/database/migrations.go`。

核心表：

- `projects`
- `folders`
- `csv_files`
- `kio_csv_headers`
- `kio_variables`
- `kio_variable_fields`
- `kio_field_metadata`
- `change_logs`
- `restore_points`
- `app_settings`
- `table_views`
- `table_view_columns`

字段元数据种子位于 `backend/constants/kio_field_metadata.go`。

