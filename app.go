// 文件说明：应用生命周期与数据库初始化入口，维护 Wails 上下文和 SQLite 连接。
// 联动 backend/database、main.go 和 Wails 生命周期。

package main

import (
	"context"
	"log"

	"king-portable-toolkit/backend/database"
)

type App struct {
	ctx context.Context
	db  *database.Database
}

func NewApp() *App {
	db, err := database.OpenDefault()
	if err != nil {
		log.Printf("database initialization failed: %v", err)
	}
	return &App{db: db}
}

func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx

	if a.db == nil {
		db, err := database.OpenDefault()
		if err != nil {
			log.Printf("database startup failed: %v", err)
			return
		}
		a.db = db
	}
}

func (a *App) Shutdown(ctx context.Context) {
	if a.db != nil {
		if err := a.db.Close(); err != nil {
			log.Printf("database shutdown failed: %v", err)
		}
	}
}

func (a *App) database() *database.Database {
	return a.db
}

func (a *App) AppName() string {
	return "便携工具包"
}
