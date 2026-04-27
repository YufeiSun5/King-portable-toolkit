// 文件说明：Wails 桌面应用入口，负责挂载前端资源、窗口配置和 Go Binding。
// 联动 app.go、backend/api、frontend/dist 和 wails.json。

package main

import (
	"embed"

	"king-portable-toolkit/backend/api"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	app := NewApp()

	err := wails.Run(&options.App{
		Title:  "便携工具包",
		Width:  1280,
		Height: 820,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		OnStartup:  app.Startup,
		OnShutdown: app.Shutdown,
		Bind: []interface{}{
			app,
			api.NewAppAPI(app.database()),
		},
	})
	if err != nil {
		println("Error:", err.Error())
	}
}
