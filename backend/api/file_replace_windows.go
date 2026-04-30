// 文件说明：Windows 文件替换实现，用系统 API 原子替换导出的 CSV 文件。
// 联动 export_file_api.go，避免同目录重复导出时生成半写入文件。

//go:build windows

package api

import "golang.org/x/sys/windows"

func replaceFile(sourcePath string, targetPath string) error {
	source, err := windows.UTF16PtrFromString(sourcePath)
	if err != nil {
		return err
	}
	target, err := windows.UTF16PtrFromString(targetPath)
	if err != nil {
		return err
	}
	return windows.MoveFileEx(source, target, windows.MOVEFILE_REPLACE_EXISTING|windows.MOVEFILE_WRITE_THROUGH)
}
