// 文件说明：数据库事务工具，统一多表写入的提交和回滚流程。
// 联动 backend/constants、backend/api、SQLite 工作区和 MEMORY 记录。

package database

import "database/sql"

func (d *Database) WithTx(fn func(tx *sql.Tx) error) error {
	tx, err := d.conn.Begin()
	if err != nil {
		return err
	}
	if err := fn(tx); err != nil {
		_ = tx.Rollback()
		return err
	}
	return tx.Commit()
}
