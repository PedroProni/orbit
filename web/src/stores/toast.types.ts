export type ToastKind = 'success' | 'error' | 'info';

export type ToastActionKind = 'open' | 'copy';

export interface ToastAction {
  kind: ToastActionKind;
  hotkey: string;
  labelKey: string;
  target: string;
  taskId?: string;
}

export interface ToastOptions {
  actions?: ToastAction[];
  ttlMs?: number;
}

export interface ToastItem {
  id: number;
  kind: ToastKind;
  messageKey: string;
  values?: Record<string, string>;
  actions?: ToastAction[];
  leaving?: boolean;
}

export interface ToastState {
  items: ToastItem[];
  push: (kind: ToastKind, messageKey: string, values?: Record<string, string>, options?: ToastOptions) => void;
  dismiss: (id: number) => void;
}
