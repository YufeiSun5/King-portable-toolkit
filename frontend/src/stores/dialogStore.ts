// 文件说明：全局弹框状态仓库，统一应用内确认、提示和输入弹框的打开/关闭与回调。
// 联动 AppDialog、Sidebar、KIO 页面和全局样式，替代浏览器原生 alert/prompt。

import { create } from 'zustand';

type DialogKind = 'info' | 'input' | 'confirm' | 'danger';

type DialogState = {
  open: boolean;
  kind: DialogKind;
  title: string;
  message: string;
  label: string;
  value: string;
  secondaryLabel: string;
  secondaryValue: string;
  confirmText: string;
  cancelText: string;
  onConfirm?: (value: string, secondaryValue: string) => void;
  showInfo: (options: { title: string; message: string; confirmText?: string }) => void;
  askInput: (options: { title: string; message?: string; label: string; value: string; confirmText?: string; onConfirm: (value: string) => void }) => void;
  askPairInput: (options: {
    title: string;
    message?: string;
    label: string;
    value: string;
    secondaryLabel: string;
    secondaryValue: string;
    confirmText?: string;
    onConfirm: (value: string, secondaryValue: string) => void;
  }) => void;
  askConfirm: (options: { title: string; message: string; confirmText?: string; kind?: DialogKind; onConfirm: () => void }) => void;
  setValue: (value: string) => void;
  setSecondaryValue: (value: string) => void;
  confirm: () => void;
  close: () => void;
};

const initial = {
  open: false,
  kind: 'info' as DialogKind,
  title: '',
  message: '',
  label: '',
  value: '',
  secondaryLabel: '',
  secondaryValue: '',
  confirmText: '确定',
  cancelText: '取消',
  onConfirm: undefined,
};

export const useDialogStore = create<DialogState>((set, get) => ({
  ...initial,
  showInfo: ({ title, message, confirmText = '知道了' }) =>
    set({ ...initial, open: true, kind: 'info', title, message, confirmText, cancelText: '', onConfirm: undefined }),
  askInput: ({ title, message = '', label, value, confirmText = '确定', onConfirm }) =>
    set({ ...initial, open: true, kind: 'input', title, message, label, value, confirmText, cancelText: '取消', onConfirm }),
  askPairInput: ({ title, message = '', label, value, secondaryLabel, secondaryValue, confirmText = '确定', onConfirm }) =>
    set({ ...initial, open: true, kind: 'input', title, message, label, value, secondaryLabel, secondaryValue, confirmText, cancelText: '取消', onConfirm }),
  askConfirm: ({ title, message, confirmText = '确定', kind = 'confirm', onConfirm }) =>
    set({ ...initial, open: true, kind, title, message, confirmText, cancelText: '取消', onConfirm }),
  setValue: (value) => set({ value }),
  setSecondaryValue: (secondaryValue) => set({ secondaryValue }),
  confirm: () => {
    const { value, secondaryValue, onConfirm } = get();
    onConfirm?.(value, secondaryValue);
    set(initial);
  },
  close: () => set(initial),
}));
