// 文件说明：一次性生成 KIO 全变量类型测试 CSV 数据，直接写入默认 SQLite 数据库。
// 联动 backend/database、backend/constants、前端工作区树和 KIO 导出验证流程。

package main

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"king-portable-toolkit/backend/constants"
	"king-portable-toolkit/backend/database"
	"king-portable-toolkit/backend/domain"
	"king-portable-toolkit/backend/utils"
)

type targetScope struct {
	projectID string
	folderID  string
}

var variableDataTypes = []string{
	"IODisc",
	"IOChar",
	"IOByte",
	"IOShort",
	"IOWord",
	"IOLong",
	"IODWord",
	"IOFloat",
	"IOString",
	"IOBlob",
	"IODouble",
	"IOInt64",
}

var registerDataTypes = []string{
	"BIT",
	"BYTE",
	"SHORT",
	"USHORT",
	"LONG",
	"LONGBCD",
	"FLOAT",
	"STRING",
	"DOUBLE",
}

func main() {
	db, err := database.OpenDefault()
	if err != nil {
		panic(err)
	}
	defer db.Close()

	scope, err := findTargetScope(db.Conn())
	if err != nil {
		panic(err)
	}

	csvName, err := uniqueCsvName(db.Conn(), scope, "全变量类型测试.csv")
	if err != nil {
		panic(err)
	}

	csvID := utils.NewID()
	if err := db.WithTx(func(tx *sql.Tx) error {
		return insertAllTypeCsv(tx, scope, csvID, csvName)
	}); err != nil {
		panic(err)
	}

	configDir, _ := os.UserConfigDir()
	fmt.Printf("已写入测试 CSV：%s\n", csvName)
	fmt.Printf("CSV ID：%s\n", csvID)
	fmt.Printf("变量数：%d\n", len(variableDataTypes))
	fmt.Printf("数据库：%s\n", filepath.Join(configDir, "PortableToolkit", "toolkit.db"))
}

func findTargetScope(conn *sql.DB) (targetScope, error) {
	var scope targetScope
	if err := conn.QueryRow(`
		SELECT id
		FROM projects
		WHERE is_deleted = 0
		ORDER BY sort_order, created_at
		LIMIT 1
	`).Scan(&scope.projectID); err != nil {
		return scope, err
	}

	err := conn.QueryRow(`
		SELECT id
		FROM folders
		WHERE project_id = ? AND is_deleted = 0
		ORDER BY depth DESC, sort_order, created_at
		LIMIT 1
	`, scope.projectID).Scan(&scope.folderID)
	if err != nil && err != sql.ErrNoRows {
		return scope, err
	}
	return scope, nil
}

func uniqueCsvName(conn *sql.DB, scope targetScope, baseName string) (string, error) {
	existing := map[string]bool{}
	rows, err := conn.Query(`
		SELECT name
		FROM csv_files
		WHERE project_id = ? AND folder_id = ? AND is_deleted = 0
	`, scope.projectID, scope.folderID)
	if err != nil {
		return "", err
	}
	defer rows.Close()

	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return "", err
		}
		existing[name] = true
	}
	if err := rows.Err(); err != nil {
		return "", err
	}
	if !existing[baseName] {
		return baseName, nil
	}

	ext := filepath.Ext(baseName)
	stem := strings.TrimSuffix(baseName, ext)
	for index := 2; ; index++ {
		name := fmt.Sprintf("%s (%d)%s", stem, index, ext)
		if !existing[name] {
			return name, nil
		}
	}
}

func insertAllTypeCsv(tx *sql.Tx, scope targetScope, csvID string, csvName string) error {
	now := utils.NowText()
	columns := exportColumns()
	if _, err := tx.Exec(`
		INSERT INTO csv_files (
			id, project_id, folder_id, name, tool_type, original_path, internal_path,
			encoding, line_ending, column_count, row_count, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, csvID, scope.projectID, scope.folderID, csvName, constants.ToolTypeKIO, "", "", "GB18030", "CRLF", len(columns), len(variableDataTypes), now, now); err != nil {
		return err
	}

	for index, column := range columns {
		if _, err := tx.Exec(`
			INSERT INTO kio_csv_headers (id, csv_file_id, column_index, column_name)
			VALUES (?, ?, ?, ?)
		`, utils.NewID(), csvID, index, column.ColumnName); err != nil {
			return err
		}
	}

	for index, variableType := range variableDataTypes {
		registerType := registerDataTypes[index%len(registerDataTypes)]
		values := rowValues(index, variableType, registerType)
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
			csvID,
			index,
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

		for columnIndex, column := range columns {
			if _, err := tx.Exec(`
				INSERT INTO kio_variable_fields (
					id, variable_id, column_index, column_name, column_value, is_visible, field_group, updated_at
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
			`, utils.NewID(), variableID, columnIndex, column.ColumnName, values[column.ColumnName], boolToInt(column.IsCommon), column.FieldGroup, now); err != nil {
				return err
			}
		}
	}
	return nil
}

func exportColumns() []domain.KioFieldMetadata {
	columns := constants.KioFieldMetadata()
	sort.SliceStable(columns, func(left, right int) bool {
		return columns[left].SortOrder < columns[right].SortOrder
	})
	return columns
}

func rowValues(index int, variableType string, registerType string) map[string]string {
	no := fmt.Sprintf("%02d", index+1)
	itemName := addressFor(index, registerType)
	return map[string]string{
		"TagID":               fmt.Sprintf("%d", 9000+index+1),
		"TagName":             sanitizeKioName(fmt.Sprintf("全类型测试_%s_%s", variableType, registerType)),
		"Description":         fmt.Sprintf("变量类型%s，寄存器类型%s", variableType, registerType),
		"TagType":             "用户变量",
		"TagDataType":         variableType,
		"MaxRawValue":         "1000000000.000000",
		"MinRawValue":         "-1000000000.000000",
		"MaxValue":            "1000000000.000000",
		"MinValue":            "-1000000000.000000",
		"NonLinearTableName":  "",
		"ConvertType":         "无",
		"IsFilter":            "否",
		"DeadBand":            "0.000000",
		"Unit":                "",
		"ChannelName":         sanitizeKioName("COM1"),
		"DeviceName":          sanitizeKioName("全变量类型测试设备"),
		"ChannelDriver":       "S71200Tcp",
		"DeviceSeries":        "S7-1500",
		"DeviceSeriesType":    "0",
		"CollectControl":      "否",
		"CollectInterval":     "1000",
		"CollectOffset":       "0",
		"TimeZoneBias":        "0",
		"TimeAdjustment":      "0",
		"Enable":              "是",
		"ForceWrite":          "否",
		"ItemName":            itemName,
		"RegName":             "DB",
		"RegType":             "3",
		"ItemDataType":        registerType,
		"ItemAccessMode":      "只读",
		"HisRecordMode":       "每次采集记录",
		"HisDeadBand":         "0.000000",
		"HisInterval":         "60",
		"TagGroup":            "测试/全变量类型",
		"NamespaceIndex":      "0",
		"IdentifierType":      "0",
		"Identifier":          "",
		"ValueRank":           "-1",
		"QueueSize":           "1",
		"DiscardOldest":       "0",
		"MonitoringMode":      "0",
		"TriggerMode":         "0",
		"DeadType":            "0",
		"DeadValue":           "0.000000",
		"UANodePath":          "",
		"RedRecordEnable":     "否",
		"MqttForwardMode":     "不记录",
		"DAForwardEnable":     "否",
		"UAForwardEnable":     "否",
		"MqttForwardInterval": "60",
		"_rowNo":              no,
	}
}

func addressFor(index int, registerType string) string {
	if registerType == "BIT" {
		return fmt.Sprintf("DB200.%d.%d", index/8, index%8)
	}
	return fmt.Sprintf("DB200.%d", 2+index*2)
}

func sanitizeKioName(value string) string {
	replacer := strings.NewReplacer(
		",", "",
		";", "",
		":", "",
		"+", "",
		"/", "",
		"*", "",
		"%", "",
		"&", "",
		"!", "",
		".", "",
		"~", "",
		"|", "",
		"^", "",
		"<", "",
		">", "",
		"=", "",
		"$", "",
		"[", "",
		"]", "",
		"{", "",
		"}", "",
		"\"", "",
		"'", "",
		"\\", "",
		"?", "",
	)
	return strings.TrimSpace(replacer.Replace(value))
}

func boolToInt(value bool) int {
	if value {
		return 1
	}
	return 0
}
