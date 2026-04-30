// 文件说明：工作区状态仓库，负责从 Wails 后端加载项目、文件夹和 CSV 树。
// 联动 Sidebar、backend/api/workspace_api.go、wailsjs 生成绑定和 SQLite 工作区数据。

import { create } from 'zustand';
import { createCsvFileSafe, createFolderSafe, createProjectSafe, deleteNodeSafe, loadWorkspaceTreeSafe, renameNodeSafe } from '../../utils/wails';

export type CsvNode = {
  id: string;
  name: string;
  rowCount: number;
  columnCount: number;
};

export type FolderNode = {
  id: string;
  name: string;
  depth: number;
  folders: FolderNode[];
  files: CsvNode[];
};

export type ProjectNode = {
  id: string;
  name: string;
  description: string;
  folders: FolderNode[];
  files: CsvNode[];
};

export type TreeNodeType = 'project' | 'folder' | 'csv';

export type SelectedTreeNode = {
  type: TreeNodeType;
  id: string;
  name: string;
  projectId: string;
  folderId: string;
};

type WorkspaceState = {
  projects: ProjectNode[];
  selectedNode: SelectedTreeNode;
  expandedNodeIds: Record<string, boolean>;
  loading: boolean;
  error: string;
  isDirty: boolean;
  load: () => Promise<void>;
  selectNode: (node: SelectedTreeNode) => void;
  toggleNode: (nodeId: string) => void;
  createProject: (name: string) => Promise<void>;
  createFolder: (projectId: string, parentFolderId: string, name: string) => Promise<void>;
  renameNode: (nodeType: 'project' | 'folder' | 'csv', nodeId: string, name: string) => Promise<void>;
  deleteNode: (nodeType: 'project' | 'folder' | 'csv', nodeId: string) => Promise<void>;
  createCsv: (projectId: string, folderId: string, name: string) => Promise<void>;
  createImportedCsv: (projectId: string, folderId: string, name: string, rowCount: number) => Promise<CsvNode>;
  markSaved: () => void;
};

const fallbackProjects: ProjectNode[] = [
  {
    id: 'fallback-project',
    name: '示例项目 - KIO变量生成器',
    description: 'Wails Binding 未就绪时展示的前端示例树。',
    files: [],
    folders: [
      {
        id: 'fallback-folder-1',
        name: '一期工程',
        depth: 0,
        files: [],
        folders: [
          {
            id: 'fallback-folder-2',
            name: '反应沉淀池',
            depth: 1,
            folders: [],
            files: [{ id: 'fallback-csv', name: '反应沉淀池B.csv', rowCount: 12, columnCount: 51 }],
          },
        ],
      },
    ],
  },
];

const fallbackSelectedNode: SelectedTreeNode = {
  type: 'project',
  id: fallbackProjects[0].id,
  name: fallbackProjects[0].name,
  projectId: fallbackProjects[0].id,
  folderId: '',
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  projects: fallbackProjects,
  selectedNode: fallbackSelectedNode,
  expandedNodeIds: {
    [fallbackProjects[0].id]: true,
    'fallback-folder-1': true,
    'fallback-folder-2': true,
  },
  loading: false,
  error: '',
  isDirty: false,
  load: async () => {
    set({ loading: true, error: '' });
    try {
      const tree = await loadWorkspaceTreeSafe();
      if (!tree) {
        const localProjects = loadLocalProjects();
        const nextProjects = localProjects.length ? localProjects : fallbackProjects;
        set((state) => ({
          projects: nextProjects,
          selectedNode: nodeExists(nextProjects, state.selectedNode) ? state.selectedNode : projectSelection(nextProjects[0]),
          expandedNodeIds: seedExpanded(nextProjects, state.expandedNodeIds),
          loading: false,
          isDirty: false,
        }));
        return;
      }
      const projects = normalizeProjects((tree?.projects as ProjectNode[] | null | undefined) ?? []);
      const nextProjects = projects.length ? projects : fallbackProjects;
      set((state) => ({
        projects: nextProjects,
        selectedNode: nodeExists(nextProjects, state.selectedNode) ? state.selectedNode : projectSelection(nextProjects[0]),
        expandedNodeIds: seedExpanded(nextProjects, state.expandedNodeIds),
        loading: false,
        isDirty: false,
      }));
    } catch (error) {
      set({ projects: fallbackProjects, loading: false, error: error instanceof Error ? error.message : '工作区加载失败' });
    }
  },
  selectNode: (selectedNode) => set({ selectedNode }),
  toggleNode: (nodeId) =>
    set((state) => ({
      expandedNodeIds: { ...state.expandedNodeIds, [nodeId]: !state.expandedNodeIds[nodeId] },
    })),
  createProject: async (name) => {
    try {
      const persisted = await createProjectSafe(name, '本地新建项目');
      const project = normalizeProject((persisted as ProjectNode | null) ?? {
        id: nextNodeId('project'),
        name,
        description: '本地新建项目',
        folders: [],
        files: [],
      });
      set((state) => ({
        projects: [...state.projects, project],
        selectedNode: projectSelection(project),
        expandedNodeIds: { ...state.expandedNodeIds, [project.id]: true },
        isDirty: true,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '项目创建失败' });
    }
  },
  createFolder: async (projectId, parentFolderId, name) => {
    try {
      const persisted = await createFolderSafe(projectId, parentFolderId, name);
      const folder: FolderNode = normalizeFolder((persisted as FolderNode | null) ?? { id: nextNodeId('folder'), name, depth: 0, folders: [], files: [] });
      set((state) => ({
        projects: state.projects.map((project) => {
          if (project.id !== projectId) {
            return project;
          }
          if (!parentFolderId) {
            return { ...project, folders: [...project.folders, folder] };
          }
          return { ...project, folders: addFolder(project.folders, parentFolderId, folder) };
        }),
        selectedNode: folderSelection(folder, projectId),
        expandedNodeIds: {
          ...state.expandedNodeIds,
          [projectId]: true,
          [folder.id]: true,
          ...(parentFolderId ? { [parentFolderId]: true } : {}),
        },
        isDirty: true,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '文件夹创建失败' });
    }
  },
  renameNode: async (nodeType, nodeId, name) => {
    try {
      await renameNodeSafe(nodeType, nodeId, name);
      set((state) => ({
        projects: state.projects.map((project) => {
          if (nodeType === 'project' && project.id === nodeId) {
            return { ...project, name };
          }
          return { ...project, folders: renameInFolders(project.folders, nodeType, nodeId, name), files: renameCsv(project.files, nodeId, name) };
        }),
        selectedNode: state.selectedNode.id === nodeId ? { ...state.selectedNode, name } : state.selectedNode,
        isDirty: true,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '重命名失败' });
    }
  },
  deleteNode: async (nodeType, nodeId) => {
    try {
      await deleteNodeSafe(nodeType, nodeId);
      set((state) => {
        const projects = state.projects
          .filter((project) => nodeType !== 'project' || project.id !== nodeId)
          .map((project) => ({
            ...project,
            folders: deleteInFolders(project.folders, nodeType, nodeId),
            files: nodeType === 'csv' ? safeFiles(project.files).filter((file) => file.id !== nodeId) : safeFiles(project.files),
          }));
        return {
          projects,
          selectedNode: nodeExists(projects, state.selectedNode) ? state.selectedNode : projectSelection(projects[0] ?? fallbackProjects[0]),
          isDirty: true,
        };
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '删除失败' });
    }
  },
  createCsv: async (projectId, folderId, name) => {
    try {
      const persisted = await createCsvFileSafe(projectId, folderId, name);
      const file: CsvNode = normalizeCsv((persisted as CsvNode | null) ?? { id: nextNodeId('csv'), name, rowCount: 0, columnCount: 51 });
      set((state) => ({
        projects: state.projects.map((project) => {
          if (project.id !== projectId) {
            return project;
          }
          if (!folderId) {
            return { ...project, files: [...safeFiles(project.files), file] };
          }
          return { ...project, folders: addCsv(project.folders, folderId, file) };
        }),
        selectedNode: csvSelection(file, projectId, folderId),
        expandedNodeIds: {
          ...state.expandedNodeIds,
          [projectId]: true,
          ...(folderId ? { [folderId]: true } : {}),
        },
        isDirty: true,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'CSV 创建失败' });
    }
  },
  createImportedCsv: async (projectId, folderId, name, rowCount) => {
    const finalName = uniqueCsvName(getSiblingFiles(useWorkspaceStore.getState().projects, projectId, folderId), name);
    const persisted = await createCsvFileSafe(projectId, folderId, finalName);
    const file: CsvNode = normalizeCsv((persisted as CsvNode | null) ?? { id: nextNodeId('csv'), name: finalName, rowCount, columnCount: 51 });
    const nextFile = { ...file, rowCount, columnCount: 51 };
    set((state) => ({
      projects: persistLocalProjects(state.projects.map((project) => {
        if (project.id !== projectId) {
          return project;
        }
        if (!folderId) {
          return { ...project, files: [...safeFiles(project.files), nextFile] };
        }
        return { ...project, folders: addCsv(project.folders, folderId, nextFile) };
      })),
      selectedNode: csvSelection(nextFile, projectId, folderId),
      expandedNodeIds: {
        ...state.expandedNodeIds,
        [projectId]: true,
        ...(folderId ? { [folderId]: true } : {}),
      },
      isDirty: true,
    }));
    return nextFile;
  },
  markSaved: () =>
    set((state) => {
      saveLocalProjects(state.projects);
      return { isDirty: false };
    }),
}));

export function projectSelection(project: ProjectNode): SelectedTreeNode {
  return { type: 'project', id: project.id, name: project.name, projectId: project.id, folderId: '' };
}

export function folderSelection(folder: FolderNode, projectId: string): SelectedTreeNode {
  return { type: 'folder', id: folder.id, name: folder.name, projectId, folderId: folder.id };
}

export function csvSelection(file: CsvNode, projectId: string, folderId: string): SelectedTreeNode {
  return { type: 'csv', id: file.id, name: file.name, projectId, folderId };
}

function addFolder(folders: FolderNode[], parentFolderId: string, folder: FolderNode): FolderNode[] {
  return safeFolders(folders).map((item) =>
    item.id === parentFolderId
      ? { ...item, folders: [...safeFolders(item.folders), { ...folder, depth: item.depth + 1 }] }
      : { ...item, folders: addFolder(safeFolders(item.folders), parentFolderId, folder) },
  );
}

function addCsv(folders: FolderNode[], folderId: string, file: CsvNode): FolderNode[] {
  return safeFolders(folders).map((item) =>
    item.id === folderId ? { ...item, files: [...safeFiles(item.files), file] } : { ...item, folders: addCsv(safeFolders(item.folders), folderId, file) },
  );
}

function getSiblingFiles(projects: ProjectNode[], projectId: string, folderId: string) {
  const project = projects.find((item) => item.id === projectId);
  if (!project) {
    return [];
  }
  if (!folderId) {
    return safeFiles(project.files);
  }
  const folder = findFolder(project.folders, folderId);
  return safeFiles(folder?.files);
}

function findFolder(folders: FolderNode[], folderId: string): FolderNode | null {
  for (const folder of safeFolders(folders)) {
    if (folder.id === folderId) {
      return folder;
    }
    const found = findFolder(folder.folders, folderId);
    if (found) {
      return found;
    }
  }
  return null;
}

function uniqueCsvName(files: CsvNode[], name: string) {
  const existing = new Set(safeFiles(files).map((file) => file.name));
  if (!existing.has(name)) {
    return name;
  }
  const dotIndex = name.toLowerCase().endsWith('.csv') ? name.length - 4 : name.length;
  const base = name.slice(0, dotIndex);
  const ext = name.slice(dotIndex);
  let index = 2;
  let nextName = `${base} (${index})${ext}`;
  while (existing.has(nextName)) {
    index += 1;
    nextName = `${base} (${index})${ext}`;
  }
  return nextName;
}

function renameInFolders(folders: FolderNode[], nodeType: 'project' | 'folder' | 'csv', nodeId: string, name: string): FolderNode[] {
  return safeFolders(folders).map((folder) => {
    if (nodeType === 'folder' && folder.id === nodeId) {
      return { ...folder, name };
    }
    return { ...folder, folders: renameInFolders(safeFolders(folder.folders), nodeType, nodeId, name), files: renameCsv(safeFiles(folder.files), nodeId, name) };
  });
}

function renameCsv(files: CsvNode[], nodeId: string, name: string): CsvNode[] {
  return safeFiles(files).map((file) => (file.id === nodeId ? { ...file, name } : file));
}

function deleteInFolders(folders: FolderNode[], nodeType: 'project' | 'folder' | 'csv', nodeId: string): FolderNode[] {
  return safeFolders(folders)
    .filter((folder) => nodeType !== 'folder' || folder.id !== nodeId)
    .map((folder) => ({
      ...folder,
      folders: deleteInFolders(safeFolders(folder.folders), nodeType, nodeId),
      files: nodeType === 'csv' ? safeFiles(folder.files).filter((file) => file.id !== nodeId) : safeFiles(folder.files),
    }));
}

function normalizeProjects(projects: ProjectNode[]): ProjectNode[] {
  return projects.map((project) => normalizeProject(project));
}

function normalizeProject(project: ProjectNode): ProjectNode {
  return {
    ...project,
    folders: normalizeFolders(safeFolders(project.folders)),
    files: safeFiles(project.files).map((file) => normalizeCsv(file)),
  };
}

function normalizeFolders(folders: FolderNode[]): FolderNode[] {
  return safeFolders(folders).map((folder) => normalizeFolder(folder));
}

function normalizeFolder(folder: FolderNode): FolderNode {
  return {
    ...folder,
    folders: normalizeFolders(safeFolders(folder.folders)),
    files: safeFiles(folder.files).map((file) => normalizeCsv(file)),
  };
}

function normalizeCsv(file: CsvNode): CsvNode {
  return {
    ...file,
    rowCount: file.rowCount ?? 0,
    columnCount: file.columnCount ?? 51,
  };
}

function safeFolders(folders: FolderNode[] | null | undefined): FolderNode[] {
  return Array.isArray(folders) ? folders : [];
}

function safeFiles(files: CsvNode[] | null | undefined): CsvNode[] {
  return Array.isArray(files) ? files : [];
}

function nextNodeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const localWorkspaceKey = 'king-portable-toolkit.workspace.v1';

function loadLocalProjects(): ProjectNode[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const text = window.localStorage.getItem(localWorkspaceKey);
    if (!text) {
      return [];
    }
    const parsed = JSON.parse(text) as { projects?: ProjectNode[] };
    return normalizeProjects(parsed.projects ?? []);
  } catch {
    return [];
  }
}

function saveLocalProjects(projects: ProjectNode[]) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(localWorkspaceKey, JSON.stringify({ projects }));
}

function persistLocalProjects(projects: ProjectNode[]) {
  saveLocalProjects(projects);
  return projects;
}

function seedExpanded(projects: ProjectNode[], current: Record<string, boolean>): Record<string, boolean> {
  const next = { ...current };
  projects.forEach((project) => {
    next[project.id] = next[project.id] ?? true;
    project.folders.forEach((folder) => seedFolderExpanded(folder, next, folder.depth < 1));
  });
  return next;
}

function seedFolderExpanded(folder: FolderNode, expanded: Record<string, boolean>, open: boolean) {
  const shouldOpen = open || safeFiles(folder.files).length > 0 || folder.depth < 2;
  expanded[folder.id] = expanded[folder.id] ?? shouldOpen;
  folder.folders.forEach((child) => seedFolderExpanded(child, expanded, shouldOpen && child.depth < 2));
}

function nodeExists(projects: ProjectNode[], selected: SelectedTreeNode): boolean {
  if (selected.type === 'project') {
    return projects.some((project) => project.id === selected.id);
  }
  if (selected.type === 'folder') {
    return projects.some((project) => folderExists(project.folders, selected.id));
  }
  return projects.some((project) => csvExists(project.files, selected.id) || project.folders.some((folder) => csvExistsInFolder(folder, selected.id)));
}

function folderExists(folders: FolderNode[], folderId: string): boolean {
  return safeFolders(folders).some((folder) => folder.id === folderId || folderExists(folder.folders, folderId));
}

function csvExists(files: CsvNode[], csvId: string): boolean {
  return safeFiles(files).some((file) => file.id === csvId);
}

function csvExistsInFolder(folder: FolderNode, csvId: string): boolean {
  return csvExists(folder.files, csvId) || safeFolders(folder.folders).some((child) => csvExistsInFolder(child, csvId));
}
