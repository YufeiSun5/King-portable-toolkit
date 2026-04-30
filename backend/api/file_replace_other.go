// 文件说明：非 Windows 文件替换实现，用 os.Rename 覆盖导出的 CSV 文件。
// 联动 export_file_api.go，保持跨平台构建可用。

//go:build !windows

package api

import "os"

func replaceFile(sourcePath string, targetPath string) error {
	return os.Rename(sourcePath, targetPath)
}
