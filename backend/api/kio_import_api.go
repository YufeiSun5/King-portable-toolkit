// 文件说明：KIO 导入 API，负责把前端解析后的 CSV 表头、变量行和完整字段写入 SQLite。
// 联动 KioEditorPage、kioTableStore、csv_files、kio_csv_headers、kio_variables 和 kio_variable_fields。

package api

import (
	"database/sql"
	"errors"
	"sort"

	"king-portable-toolkit/backend/constants"
	"king-portable-toolkit/backend/domain"
	"king-portable-toolkit/backend/utils"
)

func (a *AppAPI) SaveImportedKioCsv(csvFileID string, headers []string, variables []domain.KioVariable) (*domain.CsvFileNode, error) {
	if err := a.ensureReady(); err != nil {
		return nil, err
	}
	if csvFileID == "" {
		return nil, errors.New("csv file id is required")
	}

	csvFile, err := a.loadCsvFile(csvFileID)
	if err != nil {
		return nil, err
	}
	if csvFile.ID == "" {
		return nil, errors.New("csv file not found")
	}

	columns := normalizeImportHeaders(headers, variables)
	metadataByColumn := metadataByColumnName()
	now := utils.NowText()

	if err := a.db.WithTx(func(tx *sql.Tx) error {
		if err := clearKioCsvData(tx, csvFileID); err != nil {
			return err
		}
		for index, columnName := range columns {
			if _, err := tx.Exec(`
				INSERT INTO kio_csv_headers (id, csv_file_id, column_index, column_name)
				VALUES (?, ?, ?, ?)
			`, utils.NewID(), csvFileID, index, columnName); err != nil {
				return err
			}
		}

		for rowIndex, variable := range variables {
			values := importRowValues(variable)
			variableID := utils.NewID()
			if _, err := tx.Exec(`
				INSERT INTO kio_variables (
					id, csv_file_id, row_index, tag_id, tag_name, description, tag_type, tag_data_type,
					channel_name, device_name, channel_driver, device_series, device_series_type, tag_group,
					item_name, reg_name, reg_type, item_data_type, item_access_mode, enable, collect_control,
					collect_interval, collect_offset, force_write, his_record_mode, his_dead_band, his_interval,
					created_at, updated_at
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			`,
				variableID,
				csvFileID,
				rowIndex,
				values["TagID"],
				values["TagName"],
				values["Description"],
				values["TagType"],
				values["TagDataType"],
				values["ChannelName"],
				values["DeviceName"],
				values["ChannelDriver"],
				values["DeviceSeries"],
				values["DeviceSeriesType"],
				values["TagGroup"],
				values["ItemName"],
				values["RegName"],
				values["RegType"],
				values["ItemDataType"],
				values["ItemAccessMode"],
				values["Enable"],
				values["CollectControl"],
				values["CollectInterval"],
				values["CollectOffset"],
				values["ForceWrite"],
				values["HisRecordMode"],
				values["HisDeadBand"],
				values["HisInterval"],
				now,
				now,
			); err != nil {
				return err
			}

			for columnIndex, columnName := range columns {
				metadata := metadataByColumn[columnName]
				if _, err := tx.Exec(`
					INSERT INTO kio_variable_fields (
						id, variable_id, column_index, column_name, column_value, is_visible, field_group, updated_at
					) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
				`, utils.NewID(), variableID, columnIndex, columnName, values[columnName], boolToInt(metadata.IsCommon), metadata.FieldGroup, now); err != nil {
					return err
				}
			}
		}

		_, err := tx.Exec(`
			UPDATE csv_files
			SET row_count = ?, column_count = ?, encoding = ?, line_ending = ?, updated_at = ?
			WHERE id = ? AND is_deleted = 0
		`, len(variables), len(columns), "GB18030", "CRLF", now, csvFileID)
		return err
	}); err != nil {
		return nil, err
	}

	csvFile.RowCount = len(variables)
	csvFile.ColumnCount = len(columns)
	csvFile.Encoding = "GB18030"
	csvFile.LineEnding = "CRLF"
	csvFile.UpdatedAt = now
	return &csvFile, nil
}

func (a *AppAPI) loadCsvFile(csvFileID string) (domain.CsvFileNode, error) {
	var csvFile domain.CsvFileNode
	err := a.db.Conn().QueryRow(`
		SELECT id, project_id, folder_id, name, tool_type, COALESCE(original_path, ''), COALESCE(internal_path, ''),
			COALESCE(encoding, ''), COALESCE(line_ending, ''), COALESCE(column_count, 0), COALESCE(row_count, 0),
			created_at, updated_at
		FROM csv_files
		WHERE id = ? AND is_deleted = 0
	`, csvFileID).Scan(
		&csvFile.ID,
		&csvFile.ProjectID,
		&csvFile.FolderID,
		&csvFile.Name,
		&csvFile.ToolType,
		&csvFile.OriginalPath,
		&csvFile.InternalPath,
		&csvFile.Encoding,
		&csvFile.LineEnding,
		&csvFile.ColumnCount,
		&csvFile.RowCount,
		&csvFile.CreatedAt,
		&csvFile.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return csvFile, nil
	}
	return csvFile, err
}

func clearKioCsvData(tx *sql.Tx, csvFileID string) error {
	if _, err := tx.Exec(`
		DELETE FROM kio_variable_fields
		WHERE variable_id IN (SELECT id FROM kio_variables WHERE csv_file_id = ?)
	`, csvFileID); err != nil {
		return err
	}
	if _, err := tx.Exec(`DELETE FROM kio_variables WHERE csv_file_id = ?`, csvFileID); err != nil {
		return err
	}
	_, err := tx.Exec(`DELETE FROM kio_csv_headers WHERE csv_file_id = ?`, csvFileID)
	return err
}

func normalizeImportHeaders(headers []string, variables []domain.KioVariable) []string {
	seen := map[string]bool{}
	columns := make([]string, 0, len(headers))
	for _, header := range headers {
		if header == "" || seen[header] {
			continue
		}
		seen[header] = true
		columns = append(columns, header)
	}
	if len(columns) == 0 {
		for _, field := range sortedKioMetadata() {
			seen[field.ColumnName] = true
			columns = append(columns, field.ColumnName)
		}
	}
	for _, variable := range variables {
		for columnName := range variable.Fields {
			if columnName == "" || seen[columnName] {
				continue
			}
			seen[columnName] = true
			columns = append(columns, columnName)
		}
	}
	return columns
}

func importRowValues(variable domain.KioVariable) map[string]string {
	values := map[string]string{}
	for columnName, value := range variable.Fields {
		values[columnName] = value
	}
	setIfEmpty(values, "TagID", variable.TagID)
	setIfEmpty(values, "TagName", variable.TagName)
	setIfEmpty(values, "Description", variable.Description)
	setIfEmpty(values, "ChannelName", variable.ChannelName)
	setIfEmpty(values, "DeviceName", variable.DeviceName)
	setIfEmpty(values, "TagGroup", variable.TagGroup)
	setIfEmpty(values, "ItemName", variable.ItemName)
	setIfEmpty(values, "ItemDataType", variable.ItemDataType)
	setIfEmpty(values, "ItemAccessMode", variable.ItemAccessMode)
	setIfEmpty(values, "Enable", variable.Enable)
	setIfEmpty(values, "CollectInterval", variable.CollectInterval)
	setIfEmpty(values, "HisRecordMode", variable.HisRecordMode)
	setIfEmpty(values, "HisInterval", variable.HisInterval)
	return values
}

func setIfEmpty(values map[string]string, columnName string, value string) {
	if values[columnName] == "" {
		values[columnName] = value
	}
}

func metadataByColumnName() map[string]domain.KioFieldMetadata {
	metadata := map[string]domain.KioFieldMetadata{}
	for _, field := range sortedKioMetadata() {
		metadata[field.ColumnName] = field
	}
	return metadata
}

func sortedKioMetadata() []domain.KioFieldMetadata {
	metadata := constants.KioFieldMetadata()
	sort.SliceStable(metadata, func(left, right int) bool {
		return metadata[left].SortOrder < metadata[right].SortOrder
	})
	return metadata
}

func boolToInt(value bool) int {
	if value {
		return 1
	}
	return 0
}
