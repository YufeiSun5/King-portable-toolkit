// 文件说明：复制变量到文件夹弹框，按工作区目录选择目标文件夹并确认复制范围。
// 联动 KioEditorPage、workspaceStore、kioTableStore 和全局弹框样式。

import { Folder, X } from 'lucide-react';

export type FolderCopyTarget = {
  projectId: string;
  folderId: string;
  csvFileId: string;
  label: string;
  folderName: string;
};

type CopyToFolderDialogProps = {
  open: boolean;
  targets: FolderCopyTarget[];
  selectedTargetId: string;
  rowCount: number;
  manualCount: number;
  onSelect: (folderId: string) => void;
  onConfirm: () => void;
  onClose: () => void;
};

export function CopyToFolderDialog({ open, targets, selectedTargetId, rowCount, manualCount, onSelect, onConfirm, onClose }: CopyToFolderDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <div className="app-dialog copy-folder-dialog" role="dialog" aria-modal="true" aria-labelledby="copy-folder-title">
        <div className="dialog-titlebar">
          <div className="dialog-mark">
            <Folder size={18} />
          </div>
          <h2 id="copy-folder-title">复制变量到文件夹</h2>
          <button className="dialog-close" aria-label="关闭弹框" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <p className="dialog-message">
          {manualCount > 0 ? `将手动勾选的 ${manualCount} 个变量复制到目标文件夹。` : `未手动勾选，默认复制当前可见的 ${rowCount} 个变量。`}
        </p>
        <div className="folder-target-list">
          {targets.map((target) => (
            <button className={target.folderId === selectedTargetId ? 'is-active' : ''} type="button" key={target.folderId} onClick={() => onSelect(target.folderId)}>
              <Folder size={15} />
              <span>{target.label}</span>
              <small>{target.csvFileId ? '复制到该文件夹的首个 CSV' : '复制到文件夹层级'}</small>
            </button>
          ))}
          {targets.length === 0 && <span className="empty-target">当前项目还没有可复制到的文件夹。</span>}
        </div>
        <div className="dialog-actions">
          <button className="dialog-secondary" onClick={onClose}>
            取消
          </button>
          <button className="dialog-primary" disabled={!selectedTargetId || rowCount === 0} onClick={onConfirm}>
            复制
          </button>
        </div>
      </div>
    </div>
  );
}
