// 文件说明：KIO 编辑页，组织 CSV 信息、操作工具栏、变量表格、还原点视图和状态栏。
// 联动 layouts、features、stores 和 routes。

import {
  CheckCircle2,
  Columns3,
  Download,
  FilePlus2,
  FolderInput,
  History,
  RotateCcw,
  Save,
  Search,
  Settings2,
  Upload,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../components/ui/Button';
import { CopyToFolderDialog } from '../features/kio/components/CopyToFolderDialog';
import type { FolderCopyTarget } from '../features/kio/components/CopyToFolderDialog';
import { KioVariableTable } from '../features/kio/components/KioVariableTable';
import { useKioTableStore } from '../features/kio/stores/kioTableStore';
import type { SearchCondition } from '../features/kio/stores/kioTableStore';
import type { KioFieldMetadata } from '../features/kio/types/kio';
import { buildKioExportFiles } from '../features/kio/utils/exportCsv';
import { filterRowsByScopeAndSearch } from '../features/kio/utils/filterRows';
import { parseKioCsvText, readTextFile } from '../features/kio/utils/importCsv';
import { RestorePointGraph } from '../features/restore-point/components/RestorePointGraph';
import { kioNameInvalidCharsText } from '../features/kio/utils/kioNameRules';
import type { FolderNode, ProjectNode } from '../features/workspace/workspaceStore';
import { useWorkspaceStore } from '../features/workspace/workspaceStore';
import { useDialogStore } from '../stores/dialogStore';
import { getDeviceMacAddressSafe, saveImportedKioCsvSafe, saveKioExportFilesSafe } from '../utils/wails';

export function KioEditorPage() {
  const {
    rows,
    saveHistory,
    selectedRowId,
    manualSelectedRowIds,
    metadata,
    visibleColumns,
    searchText,
    searchConditions,
    lastAction,
    showAllFields,
    createVariable,
    copyVariable,
    copyVariablesToFolder,
    importRows,
    loadMetadata,
    loadCsvRows,
    setColumnVisible,
    setSearchText,
    addSearchCondition,
    removeSearchCondition,
    clearSearchConditions,
    toggleAllFields,
    validateRows,
    isDirty: tableDirty,
    markSaved: markTableSaved,
  } = useKioTableStore();
  const selectedNode = useWorkspaceStore((state) => state.selectedNode);
  const projects = useWorkspaceStore((state) => state.projects);
  const createImportedCsv = useWorkspaceStore((state) => state.createImportedCsv);
  const workspaceDirty = useWorkspaceStore((state) => state.isDirty);
  const markWorkspaceSaved = useWorkspaceStore((state) => state.markSaved);
  const showInfo = useDialogStore((state) => state.showInfo);
  const [showSearch, setShowSearch] = useState(false);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [showRestorePoints, setShowRestorePoints] = useState(false);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [showCopyToFolder, setShowCopyToFolder] = useState(false);
  const [copyTargetFolderId, setCopyTargetFolderId] = useState('');
  const [conditionColumn, setConditionColumn] = useState('TagName');
  const [conditionOperator, setConditionOperator] = useState<SearchCondition['operator']>('like');
  const [conditionValue, setConditionValue] = useState('');
  const [deviceAddress, setDeviceAddress] = useState('未知MAC');
  const downloadRef = useRef<HTMLAnchorElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const hasDirtyChanges = tableDirty || workspaceDirty;

  useEffect(() => {
    void loadMetadata();
  }, [loadMetadata]);

  useEffect(() => {
    void getDeviceMacAddressSafe().then(setDeviceAddress);
  }, []);

  useEffect(() => {
    if (selectedNode.type === 'csv') {
      void loadCsvRows(selectedNode.id);
    }
  }, [loadCsvRows, selectedNode.id, selectedNode.type]);

  const commonMetadata = useMemo(
    () => metadata.filter((field) => field.isCommon).sort((a, b) => a.sortOrder - b.sortOrder),
    [metadata],
  );
  const searchableMetadata = useMemo(() => (metadata.length ? metadata : fallbackSearchFields).slice().sort((a, b) => a.sortOrder - b.sortOrder), [metadata]);
  const visibleRows = useMemo(
    () => filterRowsByScopeAndSearch(rows, selectedNode, searchText, projects, searchConditions),
    [rows, selectedNode, searchText, projects, searchConditions],
  );
  const restoreCurrentRows = useMemo(() => filterRowsByScopeAndSearch(rows, selectedNode, '', projects, []), [rows, selectedNode, projects]);
  const visibleRowIds = useMemo(() => visibleRows.map((row) => row.id), [visibleRows]);
  const manualVisibleRowIds = useMemo(() => manualSelectedRowIds.filter((rowId) => visibleRowIds.includes(rowId)), [manualSelectedRowIds, visibleRowIds]);
  const effectiveRowIds = manualVisibleRowIds.length ? manualVisibleRowIds : visibleRowIds;
  const copyTargets = useMemo(() => buildFolderTargets(projects), [projects]);
  const selectedCopyTarget = copyTargets.find((target) => target.folderId === copyTargetFolderId) ?? copyTargets[0];

  const runValidate = () => {
    const result = validateRows(visibleRows);
    const hiddenErrorCount = Math.max(result.errors.length - 12, 0);
    const hiddenWarningCount = Math.max(result.warnings.length - 8, 0);
    showInfo({
      title: '校验结果',
      message: [
        `校验范围：${selectedNode.name} · 当前显示 ${visibleRows.length} 行`,
        `KIO 名称禁止字符：${kioNameInvalidCharsText}`,
        `错误：${result.errors.length}`,
        `警告：${result.warnings.length}`,
        ...result.errors.slice(0, 12),
        hiddenErrorCount ? `还有 ${hiddenErrorCount} 条错误未显示` : '',
        ...result.warnings.slice(0, 8),
        hiddenWarningCount ? `还有 ${hiddenWarningCount} 条警告未显示` : '',
      ].filter(Boolean).join('\n'),
    });
  };

  const runExport = async () => {
    const files = buildKioExportFiles(rows, projects, selectedNode, metadata);
    if (!files.length) {
      showInfo({ title: '没有可导出的 CSV', message: '当前选中的层级下面还没有 CSV 功能节点。' });
      return;
    }
    const savedFiles = await saveKioExportFilesSafe(files.map((file) => ({ relativePath: file.relativePath, downloadName: file.downloadName, content: file.content })));
    if (savedFiles) {
      if (!savedFiles.length) {
        showInfo({ title: '已取消导出', message: '没有选择导出目录，未生成 CSV 文件。' });
        return;
      }
      showInfo({
        title: '导出完成',
        message: [
          `已按 GB18030 写入 ${savedFiles.length} 个 CSV，可直接导入 KIO。`,
          ...savedFiles.slice(0, 8).map((file) => `${file.relativePath} · ${file.rowCount} 行`),
          savedFiles[0]?.filePath ? `目录：${exportDirectory(savedFiles[0].filePath)}` : '',
        ].filter(Boolean).join('\n'),
      });
      return;
    }
    files.forEach((file, index) => {
      setTimeout(() => downloadCsv(file.content, file.downloadName, downloadRef.current), index * 120);
    });
    showInfo({
      title: '导出完成',
      message: [
        `当前是浏览器调试模式，已用 UTF-8 下载 ${files.length} 个 CSV；KIO 桌面导入请用 Wails 应用里的导出，后端会写 GB18030。`,
        ...files.slice(0, 8).map((file) => `${file.relativePath} · ${file.rowCount} 行`),
      ].join('\n'),
    });
  };

  const runImport = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = async (file: File | undefined) => {
    if (!file) {
      return;
    }
    try {
      const target = importTarget(selectedNode);
      const text = await readTextFile(file);
      const preview = parseKioCsvText(text, { projectId: target.projectId, folderId: target.folderId, csvFileId: 'preview' });
      if (preview.rows.length === 0) {
        showInfo({ title: '导入失败', message: '文件里没有可导入的数据行。' });
        return;
      }
      const csvFile = await createImportedCsv(target.projectId, target.folderId, file.name, preview.rows.length);
      const parsed = parseKioCsvText(text, { projectId: target.projectId, folderId: target.folderId, csvFileId: csvFile.id });
      await saveImportedKioCsvSafe(csvFile.id, parsed.headers, parsed.rows);
      importRows(parsed.rows, csvFile.name);
      void loadCsvRows(csvFile.id);
      showInfo({
        title: '导入完成',
        message: [`已导入：${csvFile.name}`, `变量数：${parsed.rows.length}`, `字段数：${parsed.headers.length}`, csvFile.name !== file.name ? `同名文件已自动命名为：${csvFile.name}` : ''].filter(Boolean).join('\n'),
      });
    } catch (error) {
      showInfo({ title: '导入失败', message: error instanceof Error ? error.message : '文件读取或解析失败。' });
    } finally {
      if (importInputRef.current) {
        importInputRef.current.value = '';
      }
    }
  };

  const addCondition = () => {
    const value = conditionValue.trim();
    if (!value) {
      showInfo({ title: '筛选条件为空', message: '请输入要匹配的值。' });
      return;
    }
    addSearchCondition({ columnName: conditionColumn, operator: conditionOperator, value });
    setConditionValue('');
  };

  const runSave = (mode: 'current' | 'all') => {
    setShowSaveMenu(false);
    markTableSaved(mode === 'current' ? '保存当前文件' : '保存全部', selectedNode.name, mode === 'current' ? restoreCurrentRows : rows, deviceAddress);
    markWorkspaceSaved();
    showInfo({
      title: mode === 'current' ? '保存当前文件' : '保存全部',
      message:
        mode === 'current'
          ? `已保存当前文件：${selectedNode.type === 'csv' ? selectedNode.name : '当前选中层级'}。工作区结构已同步到 SQLite。`
          : `已保存全部项目、文件夹和 CSV 功能节点。工作区结构已同步到 SQLite。`,
    });
  };

  const runCopyToFolder = () => {
    if (!selectedCopyTarget) {
      showInfo({ title: '没有目标文件夹', message: '请先在左侧工作区里创建文件夹。' });
      return;
    }
    copyVariablesToFolder(effectiveRowIds, selectedCopyTarget);
    setCopyTargetFolderId(selectedCopyTarget.folderId);
    setShowCopyToFolder(false);
  };

  return (
    <>
      <div className="panel-header">
        {showSearch ? (
          <div className="top-search">
            <div className="search-main">
              <Search size={17} />
              <span>{selectedNode.name}</span>
              <input autoFocus value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="输入后立即在当前层级中过滤变量名、描述、设备、PLC地址" />
              <button
                onClick={() => {
                  setSearchText('');
                  clearSearchConditions();
                  setShowSearch(false);
                }}
              >
                关闭
              </button>
            </div>
            <div className="search-builder">
              <span>条件</span>
              <select value={conditionColumn} onChange={(event) => setConditionColumn(event.target.value)}>
                {searchableMetadata.map((field) => (
                  <option key={field.columnName} value={field.columnName}>
                    {field.displayName || field.columnName}
                  </option>
                ))}
              </select>
              <select value={conditionOperator} onChange={(event) => setConditionOperator(event.target.value as SearchCondition['operator'])}>
                <option value="like">包含</option>
                <option value="equals">等于</option>
              </select>
              <input value={conditionValue} onChange={(event) => setConditionValue(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && addCondition()} placeholder="输入值后添加" />
              <button onClick={addCondition}>添加</button>
              <button onClick={clearSearchConditions}>清空条件</button>
            </div>
            {searchConditions.length > 0 && (
              <div className="search-chips">
                {searchConditions.map((condition) => (
                  <button type="button" key={condition.id} onClick={() => removeSearchCondition(condition.id)}>
                    {fieldLabel(searchableMetadata, condition.columnName)} {condition.operator === 'equals' ? '=' : '包含'} {condition.value}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="panel-title">
              <h1>{selectedNode.name}</h1>
              <p>
                当前层级：{nodeTypeText(selectedNode.type)} · 变量数：{visibleRows.length}/{rows.length} · 字段数：{metadata.length || 51} · 编码：GB18030
              </p>
            </div>
            <div className="toolbar">
              <Button icon={<Upload size={15} />} onClick={runImport}>
                导入
              </Button>
              <div className="toolbar-menu-host">
                <Button className={`btn-save ${hasDirtyChanges ? 'is-dirty' : ''}`} icon={<Save size={15} />} onClick={() => setShowSaveMenu((value) => !value)}>
                  保存
                </Button>
                {showSaveMenu && (
                  <div className="toolbar-menu" onMouseLeave={() => setShowSaveMenu(false)}>
                    <button type="button" onClick={() => runSave('current')}>
                      保存当前文件
                    </button>
                    <button type="button" onClick={() => runSave('all')}>
                      保存全部
                    </button>
                  </div>
                )}
              </div>
              <Button icon={<FilePlus2 size={15} />} onClick={createVariable}>
                新建变量
              </Button>
              <Button
                icon={<FolderInput size={15} />}
                onClick={() => {
                  setCopyTargetFolderId(selectedCopyTarget?.folderId ?? '');
                  setShowCopyToFolder(true);
                }}
              >
                复制到文件夹
              </Button>
              <Button icon={<CheckCircle2 size={15} />} onClick={runValidate}>
                校验
              </Button>
                <Button icon={<Download size={15} />} onClick={() => void runExport()}>
                导出
              </Button>
              <Button
                icon={<History size={15} />}
                onClick={() => {
                  setShowColumnSettings(false);
                  setShowRestorePoints((value) => !value);
                }}
              >
                还原点
              </Button>
              <Button
                icon={<RotateCcw size={15} />}
                onClick={() => {
                  const copyTargetId = visibleRows.some((row) => row.id === selectedRowId) ? selectedRowId : visibleRows[0]?.id;
                  if (copyTargetId) {
                    copyVariable(copyTargetId);
                  }
                }}
              >
                复制变量
              </Button>
              <Button icon={<Columns3 size={15} />} onClick={toggleAllFields}>
                {showAllFields ? '简洁模式' : '全量模式'}
              </Button>
              <Button icon={<Search size={15} />} iconOnly title="搜索" onClick={() => setShowSearch(true)} />
              <Button icon={<Settings2 size={15} />} iconOnly title="列设置" onClick={() => setShowColumnSettings((value) => !value)} />
            </div>
          </>
        )}
      </div>
      {showColumnSettings && (
        <div className="tool-panel">
          <div className="column-settings">
            {(commonMetadata.length ? commonMetadata : metadata).slice(0, 18).map((field) => (
              <label key={field.columnName}>
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(field.columnName)}
                  onChange={(event) => setColumnVisible(field.columnName, event.target.checked)}
                />
                <span>{field.displayName || field.columnName}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      {showRestorePoints ? (
        <RestorePointGraph
          currentName={selectedNode.name}
          currentRows={restoreCurrentRows}
          saveHistory={saveHistory.map((entry) => ({
            ...entry,
            rows: filterRowsByScopeAndSearch(entry.rows, selectedNode, '', projects, []),
          }))}
          metadata={metadata}
          visibleColumns={visibleColumns}
          showAllFields={showAllFields}
          onClose={() => setShowRestorePoints(false)}
        />
      ) : (
        <KioVariableTable />
      )}
      <CopyToFolderDialog
        open={showCopyToFolder}
        targets={copyTargets}
        selectedTargetId={selectedCopyTarget?.folderId ?? ''}
        rowCount={effectiveRowIds.length}
        manualCount={manualVisibleRowIds.length}
        onSelect={setCopyTargetFolderId}
        onConfirm={runCopyToFolder}
        onClose={() => setShowCopyToFolder(false)}
      />
      <footer className="statusbar">
        <span>{lastAction}</span>
        <span>当前层级：{selectedNode.name}</span>
        <span>显示变量：{visibleRows.length}</span>
        <span>选择：{manualVisibleRowIds.length ? `手动 ${manualVisibleRowIds.length}` : `默认可见全部 ${visibleRows.length}`}</span>
        <span>搜索：{searchText || searchConditions.length ? `${searchText || '条件筛选'} · ${searchConditions.length} 条件` : '无'}</span>
        <span>右键列头或单元格可执行自动填充、批量替换、编号递增/递减、BIT 地址递增</span>
      </footer>
      <input ref={importInputRef} type="file" accept=".csv,.txt,text/csv,text/plain" style={{ display: 'none' }} onChange={(event) => void handleImportFile(event.target.files?.[0])} />
      <a ref={downloadRef} style={{ display: 'none' }} />
    </>
  );
}

function exportDirectory(filePath: string) {
  const index = Math.max(filePath.lastIndexOf('\\'), filePath.lastIndexOf('/'));
  return index > 0 ? filePath.slice(0, index) : filePath;
}

function importTarget(selectedNode: ReturnType<typeof useWorkspaceStore.getState>['selectedNode']) {
  if (selectedNode.type === 'project') {
    return { projectId: selectedNode.projectId, folderId: '' };
  }
  return { projectId: selectedNode.projectId, folderId: selectedNode.folderId };
}

function buildFolderTargets(projects: ProjectNode[]): FolderCopyTarget[] {
  return projects.flatMap((project) => project.folders.flatMap((folder) => flattenFolderTargets(project, folder, [project.name, folder.name])));
}

function flattenFolderTargets(project: ProjectNode, folder: FolderNode, pathParts: string[]): FolderCopyTarget[] {
  const firstCsv = folder.files[0];
  return [
    {
      projectId: project.id,
      folderId: folder.id,
      csvFileId: firstCsv?.id ?? '',
      label: pathParts.join(' / '),
      folderName: folder.name,
    },
    ...folder.folders.flatMap((child) => flattenFolderTargets(project, child, [...pathParts, child.name])),
  ];
}

const fallbackSearchFields = [
  { columnName: 'TagName', displayName: '变量名', sortOrder: 20 },
  { columnName: 'Description', displayName: '描述', sortOrder: 30 },
  { columnName: 'DeviceName', displayName: '设备', sortOrder: 70 },
  { columnName: 'TagGroup', displayName: '变量组', sortOrder: 110 },
  { columnName: 'ItemName', displayName: 'PLC地址', sortOrder: 120 },
].map((field) => ({ ...field, fieldGroup: '搜索', isCommon: true, description: '', example: '', editorType: 'text' }));

function fieldLabel(metadata: KioFieldMetadata[], columnName: string) {
  return metadata.find((field) => field.columnName === columnName)?.displayName || columnName;
}

function downloadCsv(content: string, filename: string, link: HTMLAnchorElement | null) {
  if (!link) {
    return;
  }
  const blob = new Blob(['\uFEFF', content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function nodeTypeText(type: string) {
  if (type === 'project') {
    return '项目';
  }
  if (type === 'folder') {
    return '文件夹';
  }
  return 'CSV';
}
