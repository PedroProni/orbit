import { ReactNode } from 'react';

export type ComposerPicker = 'list' | 'people' | 'date' | 'priority' | 'tags' | 'points' | 'kind' | 'template' | 'fields';

export type ComposerFieldLook = 'icon' | 'line';

export interface ComposerFieldProps {
  label: string;
  icon: ReactNode;
  value?: ReactNode;
  active: boolean;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: ReactNode;
  look?: ComposerFieldLook;
  align?: 'start' | 'end';
}
