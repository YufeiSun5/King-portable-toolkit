// 文件说明：版本管理 API，提供项目还原点和脏数据摘要入口。
// 联动 backend/domain、backend/database、frontend/wailsjs 和前端调用层。

package api

import "king-portable-toolkit/backend/domain"

func (a *AppAPI) CreateRestorePoint(projectID string, name string, description string) (*domain.RestorePoint, error) {
	if err := a.ensureReady(); err != nil {
		return nil, err
	}
	return nil, nil
}

func (a *AppAPI) ListRestorePoints(projectID string) ([]domain.RestorePoint, error) {
	if err := a.ensureReady(); err != nil {
		return nil, err
	}
	return []domain.RestorePoint{}, nil
}

func (a *AppAPI) RestoreProject(projectID string, restorePointID string) error {
	return a.ensureReady()
}

func (a *AppAPI) DeleteRestorePoint(restorePointID string) error {
	return a.ensureReady()
}

func (a *AppAPI) GetProjectDirtySummary(projectID string) (*domain.DirtySummary, error) {
	if err := a.ensureReady(); err != nil {
		return nil, err
	}
	return &domain.DirtySummary{ProjectID: projectID, HasDirtyChanges: false, ChangeTypeCounts: map[string]int{}}, nil
}
