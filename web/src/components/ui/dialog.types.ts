import { ReactNode } from 'react';

export type DialogVariant = 'center' | 'drawer';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  label: string;
  closeLabel: string;
  variant?: DialogVariant;
  panelClassName?: string;
  children: ReactNode;
}
