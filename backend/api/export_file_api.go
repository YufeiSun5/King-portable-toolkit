// 文件说明：KIO 文件导出 API，将前端 CSV 文本按 GB18030 编码写入本地导出目录。
// 联动 KioEditorPage、backend/database 默认工作区和 KIO 原软件导入流程。

package api

import (
	"errors"
	"os"
	"path/filepath"
	"strings"

	"king-portable-toolkit/backend/domain"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	"golang.org/x/text/encoding/simplifiedchinese"
	"golang.org/x/text/transform"
)

func (a *AppAPI) SaveKioExportFiles(files []domain.KioExportFileRequest) ([]domain.KioExportFileResult, error) {
	if err := a.ensureReady(); err != nil {
		return nil, err
	}

	exportRoot, err := a.selectExportDirectory()
	if err != nil {
		return nil, err
	}
	if strings.TrimSpace(exportRoot) == "" {
		return []domain.KioExportFileResult{}, nil
	}

	results := make([]domain.KioExportFileResult, 0, len(files))
	for _, file := range files {
		relativePath := cleanRelativeExportPath(file.RelativePath, file.DownloadName)
		targetPath := filepath.Join(exportRoot, relativePath)
		if err := os.MkdirAll(filepath.Dir(targetPath), 0o755); err != nil {
			return nil, err
		}
		encoded, _, err := transform.String(simplifiedchinese.GB18030.NewEncoder(), file.Content)
		if err != nil {
			return nil, err
		}
		if err := writeFileReplacing(targetPath, []byte(encoded)); err != nil {
			return nil, err
		}
		results = append(results, domain.KioExportFileResult{
			RelativePath: relativePath,
			FilePath:     targetPath,
			RowCount:     countCsvDataRows(file.Content),
		})
	}
	return results, nil
}

func writeFileReplacing(targetPath string, data []byte) error {
	dir := filepath.Dir(targetPath)
	tempFile, err := os.CreateTemp(dir, ".kio-export-*.tmp")
	if err != nil {
		return err
	}
	tempPath := tempFile.Name()
	closed := false
	defer func() {
		if !closed {
			_ = tempFile.Close()
		}
		_ = os.Remove(tempPath)
	}()

	if _, err := tempFile.Write(data); err != nil {
		return err
	}
	if err := tempFile.Sync(); err != nil {
		return err
	}
	if err := tempFile.Close(); err != nil {
		return err
	}
	closed = true
	return replaceFile(tempPath, targetPath)
}

func (a *AppAPI) selectExportDirectory() (string, error) {
	if a.ctx == nil {
		return "", errors.New("Wails runtime context is not initialized")
	}
	defaultDir := filepath.Join(a.db.WorkspaceDir(), "files", "exports")
	if err := os.MkdirAll(defaultDir, 0o755); err != nil {
		return "", err
	}
	return runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title:            "选择 KIO CSV 导出目录",
		DefaultDirectory: defaultDir,
	})
}

func cleanRelativeExportPath(relativePath string, fallbackName string) string {
	value := strings.TrimSpace(relativePath)
	if value == "" {
		value = strings.TrimSpace(fallbackName)
	}
	if value == "" {
		value = "KIO.csv"
	}
	parts := strings.FieldsFunc(value, func(r rune) bool {
		return r == '/' || r == '\\'
	})
	cleanParts := make([]string, 0, len(parts))
	for _, part := range parts {
		cleaned := sanitizeFileName(part)
		if cleaned != "" && cleaned != "." && cleaned != ".." {
			cleanParts = append(cleanParts, cleaned)
		}
	}
	if len(cleanParts) == 0 {
		return "KIO.csv"
	}
	if !strings.HasSuffix(strings.ToLower(cleanParts[len(cleanParts)-1]), ".csv") {
		cleanParts[len(cleanParts)-1] += ".csv"
	}
	return filepath.Join(cleanParts...)
}

func sanitizeFileName(value string) string {
	replacer := strings.NewReplacer(
		"<", "_",
		">", "_",
		":", "_",
		"\"", "_",
		"|", "_",
		"?", "_",
		"*", "_",
	)
	return strings.TrimSpace(replacer.Replace(value))
}

func countCsvDataRows(content string) int {
	lines := strings.FieldsFunc(strings.TrimSpace(content), func(r rune) bool {
		return r == '\n' || r == '\r'
	})
	if len(lines) <= 1 {
		return 0
	}
	return len(lines) - 1
}
