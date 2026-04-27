// 文件说明：通用应用弹框组件，统一输入、确认、提示和危险操作弹框样式。
// 联动 dialogStore、全局样式、Sidebar 和各业务页面弹框入口。

import { AlertTriangle, Info, X } from 'lucide-react';
import { useDialogStore } from '../../stores/dialogStore';

export function AppDialog() {
  const { open, kind, title, message, label, value, secondaryLabel, secondaryValue, confirmText, cancelText, setValue, setSecondaryValue, confirm, close } = useDialogStore();

  if (!open) {
    return null;
  }

  const danger = kind === 'danger';

  return (
    <div className="dialog-backdrop" role="presentation">
      <div className={`app-dialog ${danger ? 'is-danger' : ''}`} role="dialog" aria-modal="true" aria-labelledby="app-dialog-title">
        <div className="dialog-titlebar">
          <div className="dialog-mark">{danger ? <AlertTriangle size={18} /> : <Info size={18} />}</div>
          <h2 id="app-dialog-title">{title}</h2>
          <button className="dialog-close" aria-label="关闭弹框" onClick={close}>
            <X size={16} />
          </button>
        </div>
        {message && <p className="dialog-message">{message}</p>}
        {kind === 'input' && (
          <>
            <label className="dialog-field">
              <span>{label}</span>
              <input autoFocus value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && !secondaryLabel && confirm()} />
            </label>
            {secondaryLabel && (
              <label className="dialog-field">
                <span>{secondaryLabel}</span>
                <input value={secondaryValue} onChange={(event) => setSecondaryValue(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && confirm()} />
              </label>
            )}
          </>
        )}
        <div className="dialog-actions">
          {cancelText && (
            <button className="dialog-secondary" onClick={close}>
              {cancelText}
            </button>
          )}
          <button className="dialog-primary" onClick={confirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
