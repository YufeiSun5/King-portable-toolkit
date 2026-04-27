// 文件说明：表格批量操作 API，负责列/行操作预览和应用的 Wails Binding。
// 联动 backend/domain、backend/database、frontend/wailsjs 和前端调用层。

package api

import "king-portable-toolkit/backend/domain"

func (a *AppAPI) PreviewColumnOperation(csvFileID string, operation domain.ColumnOperation) (*domain.OperationPreview, error) {
	if err := a.ensureReady(); err != nil {
		return nil, err
	}
	return &domain.OperationPreview{
		AffectedCount: 0,
		ColumnName:    operation.ColumnName,
		OperationType: operation.OperationType,
		Before:        []domain.PreviewSample{},
		After:         []domain.PreviewSample{},
	}, nil
}

func (a *AppAPI) ApplyColumnOperation(csvFileID string, operation domain.ColumnOperation) (*domain.OperationResult, error) {
	if err := a.ensureReady(); err != nil {
		return nil, err
	}
	return &domain.OperationResult{AffectedCount: 0}, nil
}

func (a *AppAPI) PreviewRowOperation(csvFileID string, operation map[string]interface{}) (*domain.OperationPreview, error) {
	if err := a.ensureReady(); err != nil {
		return nil, err
	}
	return &domain.OperationPreview{Before: []domain.PreviewSample{}, After: []domain.PreviewSample{}}, nil
}

func (a *AppAPI) ApplyRowOperation(csvFileID string, operation map[string]interface{}) (*domain.OperationResult, error) {
	if err := a.ensureReady(); err != nil {
		return nil, err
	}
	return &domain.OperationResult{}, nil
}
