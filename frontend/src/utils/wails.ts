// 文件说明：Wails 前端调用工具，封装运行时检测和后端 Binding 的安全调用。
// 联动 frontend/wailsjs 生成代码、workspaceStore、KIO store 和 Wails dev/build 运行时。

import {
  CreateCsvFile,
  CreateFolder,
  CreateProject,
  DeleteCsvFile,
  DeleteFolder,
  DeleteProject,
  GetFieldMetadata,
  LoadWorkspaceTree,
  RenameCsvFile,
  RenameFolder,
  RenameProject,
} from '../../wailsjs/go/api/AppAPI';

export function hasWailsRuntime() {
  return typeof window !== 'undefined' && Boolean((window as Window & { go?: unknown }).go);
}

export async function loadWorkspaceTreeSafe() {
  if (!hasWailsRuntime()) {
    return null;
  }
  return LoadWorkspaceTree();
}

export async function loadFieldMetadataSafe() {
  if (!hasWailsRuntime()) {
    return [];
  }
  return GetFieldMetadata();
}

export async function createProjectSafe(name: string, description: string) {
  if (!hasWailsRuntime()) {
    return null;
  }
  return CreateProject(name, description);
}

export async function createFolderSafe(projectId: string, parentFolderId: string, name: string) {
  if (!hasWailsRuntime()) {
    return null;
  }
  return CreateFolder(projectId, parentFolderId, name);
}

export async function createCsvFileSafe(projectId: string, folderId: string, name: string) {
  if (!hasWailsRuntime()) {
    return null;
  }
  return CreateCsvFile(projectId, folderId, name);
}

export async function renameNodeSafe(nodeType: 'project' | 'folder' | 'csv', nodeId: string, name: string) {
  if (!hasWailsRuntime()) {
    return;
  }
  if (nodeType === 'project') {
    await RenameProject(nodeId, name);
    return;
  }
  if (nodeType === 'folder') {
    await RenameFolder(nodeId, name);
    return;
  }
  await RenameCsvFile(nodeId, name);
}

export async function deleteNodeSafe(nodeType: 'project' | 'folder' | 'csv', nodeId: string) {
  if (!hasWailsRuntime()) {
    return;
  }
  if (nodeType === 'project') {
    await DeleteProject(nodeId);
    return;
  }
  if (nodeType === 'folder') {
    await DeleteFolder(nodeId);
    return;
  }
  await DeleteCsvFile(nodeId);
}
