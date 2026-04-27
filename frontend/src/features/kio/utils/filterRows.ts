// 文件说明：KIO 变量过滤工具，按左侧选中层级和顶部搜索词计算当前应展示的变量。
// 联动 workspaceStore、kioTableStore、KioVariableTable、RightPanel 和 KioEditorPage。

import type { FolderNode, ProjectNode, SelectedTreeNode } from '../../workspace/workspaceStore';
import type { KioVariable } from '../types/kio';
import type { SearchCondition } from '../stores/kioTableStore';
import { readKioCell } from './rowValue';

export function filterRowsByScopeAndSearch(
  rows: KioVariable[],
  selectedNode: SelectedTreeNode,
  searchText: string,
  projects: ProjectNode[] = [],
  conditions: SearchCondition[] = [],
) {
  const folderScope = selectedNode.type === 'folder' ? collectFolderScope(projects, selectedNode.id) : { ids: [], names: [] };
  const selectedProject = projects.find((project) => project.id === selectedNode.projectId);
  const scopedRows = rows.filter((row) => rowMatchesScope(row, selectedNode, folderScope, selectedProject));
  const keyword = searchText.trim().toLowerCase();

  return scopedRows.filter((row) => {
    const keywordMatched =
      !keyword || [row.tagName, row.description, row.channelName, row.deviceName, row.tagGroup, row.itemName].some((value) => value.toLowerCase().includes(keyword));
    return keywordMatched && conditions.every((condition) => conditionMatches(row, condition));
  });
}

function rowMatchesScope(row: KioVariable, selectedNode: SelectedTreeNode, folderScope: { ids: string[]; names: string[] }, selectedProject: ProjectNode | undefined) {
  if (selectedNode.type === 'project') {
    return row.projectId === selectedNode.projectId || (row.projectId === 'fallback-project' && selectedProject?.name === '示例项目 - KIO变量生成器');
  }
  if (selectedNode.type === 'folder') {
    return Boolean(row.folderId && folderScope.ids.includes(row.folderId)) || (row.folderId === 'fallback-folder-2' && folderScope.names.includes('反应沉淀池'));
  }
  return row.csvFileId === selectedNode.id || (row.csvFileId === 'fallback-csv' && selectedNode.name === '反应沉淀池B.csv');
}

function collectFolderScope(projects: ProjectNode[], folderId: string) {
  for (const project of projects) {
    for (const folder of project.folders ?? []) {
      const found = findFolder(folder, folderId);
      if (found) {
        return { ids: flattenFolderIds(found), names: flattenFolderNames(found) };
      }
    }
  }
  return { ids: [folderId], names: [] };
}

function findFolder(folder: FolderNode, folderId: string): FolderNode | null {
  if (folder.id === folderId) {
    return folder;
  }
  for (const child of folder.folders ?? []) {
    const found = findFolder(child, folderId);
    if (found) {
      return found;
    }
  }
  return null;
}

function flattenFolderIds(folder: FolderNode): string[] {
  return [folder.id, ...(folder.folders ?? []).flatMap((child) => flattenFolderIds(child))];
}

function flattenFolderNames(folder: FolderNode): string[] {
  return [folder.name, ...(folder.folders ?? []).flatMap((child) => flattenFolderNames(child))];
}

function conditionMatches(row: KioVariable, condition: SearchCondition) {
  const expected = condition.value.trim().toLowerCase();
  if (!expected) {
    return true;
  }
  const current = readKioCell(row, condition.columnName).toLowerCase();
  if (condition.operator === 'equals') {
    return current === expected;
  }
  return current.includes(expected);
}
