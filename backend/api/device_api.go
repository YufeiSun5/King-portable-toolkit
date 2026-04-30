// 文件说明：设备信息 API，提供本机网络标识给前端用于保存记录来源展示。
// 联动 KioEditorPage、RestorePointGraph、frontend/wailsjs 和 Wails Binding。

package api

import (
	"net"
	"strings"
)

func (a *AppAPI) GetDeviceMacAddress() string {
	interfaces, err := net.Interfaces()
	if err != nil {
		return "未知MAC"
	}
	for _, item := range interfaces {
		if item.Flags&net.FlagLoopback != 0 || item.Flags&net.FlagUp == 0 || len(item.HardwareAddr) == 0 {
			continue
		}
		return strings.ToUpper(item.HardwareAddr.String())
	}
	return "未知MAC"
}
