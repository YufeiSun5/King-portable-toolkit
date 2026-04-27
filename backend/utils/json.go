// 文件说明：JSON 工具，统一将变更详情等结构序列化为文本。
// 联动 backend/api、database、repositories 和 services。

package utils

import "encoding/json"

func MustJSON(value interface{}) string {
	data, err := json.Marshal(value)
	if err != nil {
		return "{}"
	}
	return string(data)
}
