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
	return &domain.KioProject{
		Headers:   []domain.KioCsvHeader{},
		Variables: []domain.KioVariable{},
		Fields:    []domain.KioFieldValue{},
		Metadata:  constants.KioFieldMetadata(),
	}, nil
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
