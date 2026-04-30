// 文件说明：KIO API，提供字段元数据、变量详情和单元格编辑的 Wails Binding。
// 联动 backend/domain、backend/database、frontend/wailsjs 和前端调用层。

package api

import (
	"database/sql"

	"king-portable-toolkit/backend/constants"
	"king-portable-toolkit/backend/domain"
	"king-portable-toolkit/backend/utils"
)

func (a *AppAPI) GetFieldMetadata() ([]domain.KioFieldMetadata, error) {
	if err := a.ensureReady(); err != nil {
		return nil, err
	}
	return constants.KioFieldMetadata(), nil
}

func (a *AppAPI) GetKioProject(csvFileID string) (*domain.KioProject, error) {
	if err := a.ensureReady(); err != nil {
		return nil, err
	}
	var csvFile domain.CsvFileNode
	if err := a.db.Conn().QueryRow(`
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
	); err != nil {
		if err == sql.ErrNoRows {
			return &domain.KioProject{
				Headers:   []domain.KioCsvHeader{},
				Variables: []domain.KioVariable{},
				Fields:    []domain.KioFieldValue{},
				Metadata:  constants.KioFieldMetadata(),
			}, nil
		}
		return nil, err
	}

	headers, err := a.loadKioHeaders(csvFileID)
	if err != nil {
		return nil, err
	}
	variables, err := a.loadKioVariables(csvFile)
	if err != nil {
		return nil, err
	}
	fields, err := a.loadKioFields(csvFileID)
	if err != nil {
		return nil, err
	}
	return &domain.KioProject{
		CsvFile:   csvFile,
		Headers:   headers,
		Variables: variables,
		Fields:    fields,
		Metadata:  constants.KioFieldMetadata(),
	}, nil
}

func (a *AppAPI) loadKioHeaders(csvFileID string) ([]domain.KioCsvHeader, error) {
	rows, err := a.db.Conn().Query(`
		SELECT id, csv_file_id, column_index, column_name
		FROM kio_csv_headers
		WHERE csv_file_id = ?
		ORDER BY column_index
	`, csvFileID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	headers := []domain.KioCsvHeader{}
	for rows.Next() {
		var header domain.KioCsvHeader
		if err := rows.Scan(&header.ID, &header.CsvFileID, &header.ColumnIndex, &header.ColumnName); err != nil {
			return nil, err
		}
		headers = append(headers, header)
	}
	return headers, rows.Err()
}

func (a *AppAPI) loadKioVariables(csvFile domain.CsvFileNode) ([]domain.KioVariable, error) {
	rows, err := a.db.Conn().Query(`
		SELECT id, row_index, COALESCE(tag_id, ''), COALESCE(tag_name, ''), COALESCE(description, ''),
			COALESCE(channel_name, ''), COALESCE(device_name, ''), COALESCE(tag_group, ''), COALESCE(item_name, ''),
			COALESCE(item_data_type, ''), COALESCE(item_access_mode, ''), COALESCE(enable, ''),
			COALESCE(collect_interval, ''), COALESCE(his_record_mode, ''), COALESCE(his_interval, ''),
			created_at, updated_at
		FROM kio_variables
		WHERE csv_file_id = ? AND is_deleted = 0
		ORDER BY row_index
	`, csvFile.ID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	variables := []domain.KioVariable{}
	for rows.Next() {
		var variable domain.KioVariable
		variable.ProjectID = csvFile.ProjectID
		variable.FolderID = csvFile.FolderID
		variable.CsvFileID = csvFile.ID
		variable.Fields = map[string]string{}
		if err := rows.Scan(
			&variable.ID,
			&variable.RowIndex,
			&variable.TagID,
			&variable.TagName,
			&variable.Description,
			&variable.ChannelName,
			&variable.DeviceName,
			&variable.TagGroup,
			&variable.ItemName,
			&variable.ItemDataType,
			&variable.ItemAccessMode,
			&variable.Enable,
			&variable.CollectInterval,
			&variable.HisRecordMode,
			&variable.HisInterval,
			&variable.CreatedAt,
			&variable.UpdatedAt,
		); err != nil {
			return nil, err
		}
		variables = append(variables, variable)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	fields, err := a.loadKioFields(csvFile.ID)
	if err != nil {
		return nil, err
	}
	fieldsByVariable := map[string]map[string]string{}
	for _, field := range fields {
		if fieldsByVariable[field.VariableID] == nil {
			fieldsByVariable[field.VariableID] = map[string]string{}
		}
		fieldsByVariable[field.VariableID][field.ColumnName] = field.ColumnValue
	}
	for index := range variables {
		if fieldsByVariable[variables[index].ID] != nil {
			variables[index].Fields = fieldsByVariable[variables[index].ID]
		}
	}
	return variables, nil
}

func (a *AppAPI) loadKioFields(csvFileID string) ([]domain.KioFieldValue, error) {
	rows, err := a.db.Conn().Query(`
		SELECT f.id, f.variable_id, f.column_index, f.column_name, COALESCE(f.column_value, ''), f.is_visible, COALESCE(f.field_group, ''), f.updated_at
		FROM kio_variable_fields f
		INNER JOIN kio_variables v ON v.id = f.variable_id
		WHERE v.csv_file_id = ? AND v.is_deleted = 0
		ORDER BY v.row_index, f.column_index
	`, csvFileID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	fields := []domain.KioFieldValue{}
	for rows.Next() {
		var field domain.KioFieldValue
		var visible int
		if err := rows.Scan(&field.ID, &field.VariableID, &field.ColumnIndex, &field.ColumnName, &field.ColumnValue, &visible, &field.FieldGroup, &field.UpdatedAt); err != nil {
			return nil, err
		}
		field.IsVisible = visible == 1
		fields = append(fields, field)
	}
	return fields, rows.Err()
}

func (a *AppAPI) UpdateCell(variableID string, columnName string, value string) error {
	if err := a.ensureReady(); err != nil {
		return err
	}

	_, err := a.db.Conn().Exec(`
		UPDATE kio_variable_fields
		SET column_value = ?, updated_at = ?
		WHERE variable_id = ? AND column_name = ?
	`, value, utils.NowText(), variableID, columnName)
	return err
}

func (a *AppAPI) UpdateVariableFields(variableID string, fields map[string]string) error {
	if err := a.ensureReady(); err != nil {
		return err
	}

	return a.db.WithTx(func(tx *sql.Tx) error {
		for columnName, value := range fields {
			_, err := tx.Exec(`
				UPDATE kio_variable_fields
				SET column_value = ?, updated_at = ?
				WHERE variable_id = ? AND column_name = ?
			`, value, utils.NowText(), variableID, columnName)
			if err != nil {
				return err
			}
		}
		return nil
	})
}

func (a *AppAPI) GetVariableAllFields(variableID string) ([]domain.KioFieldValue, error) {
	if err := a.ensureReady(); err != nil {
		return nil, err
	}
	rows, err := a.db.Conn().Query(`
		SELECT id, variable_id, column_index, column_name, COALESCE(column_value, ''), is_visible, COALESCE(field_group, ''), updated_at
		FROM kio_variable_fields
		WHERE variable_id = ?
		ORDER BY column_index
	`, variableID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	fields := []domain.KioFieldValue{}
	for rows.Next() {
		var field domain.KioFieldValue
		var visible int
		if err := rows.Scan(&field.ID, &field.VariableID, &field.ColumnIndex, &field.ColumnName, &field.ColumnValue, &visible, &field.FieldGroup, &field.UpdatedAt); err != nil {
			return nil, err
		}
		field.IsVisible = visible == 1
		fields = append(fields, field)
	}
	return fields, rows.Err()
}
