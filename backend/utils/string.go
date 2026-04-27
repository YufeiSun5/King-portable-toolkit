// 文件说明：字符串工具，统一空值判断等通用文本处理。
// 联动 backend/api、database、repositories 和 services。

package utils

import "strings"

func IsBlank(value string) bool {
	return strings.TrimSpace(value) == ""
}
