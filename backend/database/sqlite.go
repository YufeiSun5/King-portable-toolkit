// 文件说明：SQLite 打开和工作区目录初始化，负责本地数据中心启动。
// 联动 backend/constants、backend/api、SQLite 工作区和 MEMORY 记录。

package database

import (
	"database/sql"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

type Database struct {
	conn         *sql.DB
	workspaceDir string
}

func OpenDefault() (*Database, error) {
	workspace, err := defaultWorkspaceDir()
	if err != nil {
		return nil, err
	}
	return Open(filepath.Join(workspace, "toolkit.db"), workspace)
}

func Open(dbPath string, workspaceDir string) (*Database, error) {
	if err := ensureWorkspaceDirs(workspaceDir); err != nil {
		return nil, err
	}

	conn, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, err
	}

	db := &Database{conn: conn, workspaceDir: workspaceDir}
	if err := db.Migrate(); err != nil {
		_ = conn.Close()
		return nil, err
	}
	if err := db.Seed(); err != nil {
		_ = conn.Close()
		return nil, err
	}
	return db, nil
}

func (d *Database) Conn() *sql.DB {
	return d.conn
}

func (d *Database) WorkspaceDir() string {
	return d.workspaceDir
}

func (d *Database) Close() error {
	return d.conn.Close()
}

func defaultWorkspaceDir() (string, error) {
	root, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(root, "PortableToolkit"), nil
}

func ensureWorkspaceDirs(root string) error {
	dirs := []string{
		root,
		filepath.Join(root, "files", "imports"),
		filepath.Join(root, "files", "exports"),
		filepath.Join(root, "files", "temp"),
		filepath.Join(root, "snapshots", "projects"),
		filepath.Join(root, "logs"),
		filepath.Join(root, "config"),
	}
	for _, dir := range dirs {
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return err
		}
	}
	return nil
}
