// 文件说明：ID 工具，统一生成数据库主键和业务对象标识。
// 联动 backend/api、database、repositories 和 services。

package utils

import "github.com/google/uuid"

func NewID() string {
	return uuid.NewString()
}
