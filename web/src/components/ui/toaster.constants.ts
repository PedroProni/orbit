import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { ToastKind } from '@/stores/toast.types';

export const TOAST_STYLES: Record<ToastKind, string> = {
  success: 'border-emerald-500/40 text-emerald-300',
  error: 'border-red-500/50 text-red-300',
  info: 'border-line text-fg',
};

export const TOAST_ICONS = { success: CheckCircle2, error: AlertCircle, info: Info } as const;
