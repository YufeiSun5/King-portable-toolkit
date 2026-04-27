// 文件说明：时间工具，统一生成数据库与 API 使用的时间字符串。
// 联动 backend/api、database、repositories 和 services。

package utils

import "time"

func NowText() string {
	return time.Now().Format(time.RFC3339)
}
