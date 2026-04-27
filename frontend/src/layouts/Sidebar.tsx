// 文件说明：KIO 工作区树，负责管理项目、文件夹和 CSV 节点。
// 联动 KioEditorPage、workspaceStore 和全局样式。

import { type MouseEvent, useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, FileSpreadsheet, Folder, FolderOpen, Loader2, Plus, RotateCcw, Trash2 } from 'lucide-react';
import {
  type CsvNode,
  type FolderNode,
  type ProjectNode,
  csvSelection,
  folderSelection,
  projectSelection,
  useWorkspaceStore,
} from '../features/workspace/workspaceStore';
import { useDialogStore } from '../stores/dialogStore';

type TreeMenu =
  | { type: 'project'; node: ProjectNode; x: number; y: number }
  | { type: 'folder'; node: FolderNode; projectId: string; x: number; y: number }
  | { type: 'csv'; node: CsvNode; projectId: string; folderId: string; x: number; y: number };

export function Sidebar() {
  const {
    projects,
    selectedNode,
    expandedNodeIds,
    loading,
    error,
    load,
    selectNode,
    toggleNode,
    createProject,
    createFolder,
    createCsv,
    renameNode,
    deleteNode,
  } = useWorkspaceStore();
  const { askInput, askConfirm, showInfo } = useDialogStore();
  const [menu, setMenu] = useState<TreeMenu | null>(null);

  useEffect(() => {
    void load();
  }, [load]);

  const openMenu = (event: MouseEvent, nextMenu: TreeMenu) => {
    event.preventDefault();
    event.stopPropagation();
    setMenu(nextMenu);
  };

  const runMenuAction = (action: () => void) => {
    action();
    setMenu(null);
  };

  const createFolderDialog = (projectId: string, parentFolderId: string) =>
    askInput({
      title: parentFolderId ? '新建子文件夹' : '新建文件夹',
      message: '文件夹用于组织 KIO CSV，可在任意层级继续创建子文件夹。',
      label: '文件夹名称',
      value: '新文件夹',
      onConfirm: (value) => createFolder(projectId, parentFolderId, value.trim() || '新文件夹'),
    });

  const createProjectDialog = () =>
    askInput({
      title: '新建项目',
      message: '项目是工作区树的顶级目录，可包含多个文件夹和 KIO CSV。',
      label: '项目名称',
      value: '新项目',
      onConfirm: (value) => createProject(value.trim() || '新项目'),
    });

  const createCsvDialog = (projectId: string, folderId: string, defaultName: string) =>
    askInput({
      title: '新建 KIO CSV',
      message: '这里创建的是工作区里的 CSV 功能节点，不会直接在磁盘生成真实文件。',
      label: 'CSV 名称',
      value: defaultName,
      onConfirm: (value) => createCsv(projectId, folderId, value.trim() || defaultName),
    });

  const renameDialog = (nodeType: 'project' | 'folder' | 'csv', nodeId: string, title: string, label: string, value: string) =>
    askInput({
      title,
      label,
      value,
      onConfirm: (nextValue) => renameNode(nodeType, nodeId, nextValue.trim() || value),
    });

  const deleteDialog = (nodeType: 'project' | 'folder' | 'csv', nodeId: string, name: string) =>
    askConfirm({
      title: `删除${nodeTypeText(nodeType)}`,
      message: `确定删除“${name}”吗？当前开发态会从左侧树移除该节点。`,
      kind: 'danger',
      confirmText: '删除',
      onConfirm: () => deleteNode(nodeType, nodeId),
    });

  return (
    <aside className="sidebar" onClick={() => setMenu(null)}>
      <div className="tree">
        <div className="tree-heading">
          <p className="tree-title">工作区</p>
          <button type="button" title="新建项目" aria-label="新建项目" onClick={createProjectDialog}>
            <Plus size={14} />
          </button>
        </div>
        {loading && (
          <div className="tree-item">
            <Loader2 size={14} />
            <span>正在加载</span>
          </div>
        )}
        {error && <p className="tree-hint">{error}</p>}
        {projects.map((project) => (
          <div key={project.id}>
            <div
              className={`tree-item tree-project ${selectedNode.id === project.id ? 'is-active' : ''}`}
              onClick={(event) => {
                event.stopPropagation();
                selectNode(projectSelection(project));
                toggleNode(project.id);
              }}
              onContextMenu={(event) => openMenu(event, { type: 'project', node: project, x: event.clientX, y: event.clientY })}
            >
              <button
                className="tree-toggle"
                aria-label={expandedNodeIds[project.id] ? '收起项目' : '展开项目'}
                onClick={(event) => {
                  event.stopPropagation();
                  toggleNode(project.id);
                }}
              >
                {expandedNodeIds[project.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {expandedNodeIds[project.id] ? <FolderOpen size={15} /> : <Folder size={15} />}
              <span>{project.name}</span>
              <b>项目</b>
            </div>
            {expandedNodeIds[project.id] && (
              <>
                {(project.folders ?? []).map((folder) => (
                  <FolderBranch folder={folder} level={1} projectId={project.id} openMenu={openMenu} key={folder.id} />
                ))}
                {(project.files ?? []).map((file) => (
                  <div
                    className={`tree-item tree-csv ${selectedNode.id === file.id ? 'is-active' : ''}`}
                    style={{ paddingLeft: 28 }}
                    key={file.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      selectNode(csvSelection(file, project.id, ''));
                    }}
                    onContextMenu={(event) => openMenu(event, { type: 'csv', node: file, projectId: project.id, folderId: '', x: event.clientX, y: event.clientY })}
                  >
                    <FileSpreadsheet size={15} />
                    <span>{file.name}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        ))}
      </div>
      {menu && (
        <div className="tree-context-menu" style={{ left: menu.x, top: menu.y }} onMouseLeave={() => setMenu(null)}>
          {menu.type === 'project' && (
            <>
              <button onClick={() => runMenuAction(() => createFolderDialog(menu.node.id, ''))}>
                <Plus size={14} />
                新建文件夹
              </button>
              <button onClick={() => runMenuAction(() => createCsvDialog(menu.node.id, '', '新建KIO.csv'))}>
                <FileSpreadsheet size={14} />
                新建 KIO CSV
              </button>
              <button onClick={() => runMenuAction(() => showInfo({ title: '创建还原点', message: `已创建还原点：${menu.node.name}` }))}>
                <RotateCcw size={14} />
                创建还原点
              </button>
              <button onClick={() => runMenuAction(() => renameDialog('project', menu.node.id, '重命名项目', '项目名称', menu.node.name))}>
                重命名项目
              </button>
              <button className="danger" onClick={() => runMenuAction(() => deleteDialog('project', menu.node.id, menu.node.name))}>
                <Trash2 size={14} />
                删除项目
              </button>
            </>
          )}
          {menu.type === 'folder' && (
            <>
              <button onClick={() => runMenuAction(() => createFolderDialog(menu.projectId, menu.node.id))}>
                <Plus size={14} />
                新建子文件夹
              </button>
              <button onClick={() => runMenuAction(() => createCsvDialog(menu.projectId, menu.node.id, '新建KIO.csv'))}>
                <FileSpreadsheet size={14} />
                新建 CSV
              </button>
              <button onClick={() => runMenuAction(() => renameDialog('folder', menu.node.id, '重命名文件夹', '文件夹名称', menu.node.name))}>
                重命名文件夹
              </button>
              <button className="danger" onClick={() => runMenuAction(() => deleteDialog('folder', menu.node.id, menu.node.name))}>
                <Trash2 size={14} />
                删除文件夹
              </button>
            </>
          )}
          {menu.type === 'csv' && (
            <>
              <button onClick={() => runMenuAction(() => showInfo({ title: '打开 CSV', message: `已选择：${menu.node.name}` }))}>
                <FileSpreadsheet size={14} />
                打开
              </button>
              <button onClick={() => runMenuAction(() => renameDialog('csv', menu.node.id, '重命名 CSV', 'CSV 名称', menu.node.name))}>
                重命名 CSV
              </button>
              <button onClick={() => runMenuAction(() => showInfo({ title: '导出 CSV', message: `已触发导出：${menu.node.name}` }))}>导出</button>
              <button className="danger" onClick={() => runMenuAction(() => deleteDialog('csv', menu.node.id, menu.node.name))}>
                <Trash2 size={14} />
                删除 CSV
              </button>
            </>
          )}
        </div>
      )}
    </aside>
  );
}

function FolderBranch({
  folder,
  level,
  projectId,
  openMenu,
}: {
  folder: FolderNode;
  level: number;
  projectId: string;
  openMenu: (event: MouseEvent, menu: TreeMenu) => void;
}) {
  const { selectedNode, expandedNodeIds, selectNode, toggleNode } = useWorkspaceStore();
  const paddingLeft = 8 + level * 20;
  const isExpanded = Boolean(expandedNodeIds[folder.id]);

  return (
    <>
      <div
        className={`tree-item tree-folder ${selectedNode.id === folder.id ? 'is-active' : ''}`}
        style={{ paddingLeft }}
        onClick={(event) => {
          event.stopPropagation();
          selectNode(folderSelection(folder, projectId));
          toggleNode(folder.id);
        }}
        onContextMenu={(event) => openMenu(event, { type: 'folder', node: folder, projectId, x: event.clientX, y: event.clientY })}
      >
        <button
          className="tree-toggle"
          aria-label={isExpanded ? '收起文件夹' : '展开文件夹'}
          onClick={(event) => {
            event.stopPropagation();
            toggleNode(folder.id);
          }}
        >
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {isExpanded ? <FolderOpen size={15} /> : <Folder size={15} />}
        <span>{folder.name}</span>
      </div>
      {isExpanded && (
        <>
          {(folder.folders ?? []).map((child) => (
            <FolderBranch folder={child} level={level + 1} projectId={projectId} openMenu={openMenu} key={child.id} />
          ))}
          {(folder.files ?? []).map((file) => (
            <div
              className={`tree-item tree-csv ${selectedNode.id === file.id ? 'is-active' : ''}`}
              style={{ paddingLeft: paddingLeft + 20 }}
              key={file.id}
              onClick={(event) => {
                event.stopPropagation();
                selectNode(csvSelection(file, projectId, folder.id));
              }}
              onContextMenu={(event) => openMenu(event, { type: 'csv', node: file, projectId, folderId: folder.id, x: event.clientX, y: event.clientY })}
            >
              <FileSpreadsheet size={15} />
              <span>{file.name}</span>
            </div>
          ))}
        </>
      )}
    </>
  );
}

function nodeTypeText(type: 'project' | 'folder' | 'csv') {
  if (type === 'project') {
    return '项目';
  }
  if (type === 'folder') {
    return '文件夹';
  }
  return 'CSV';
}
