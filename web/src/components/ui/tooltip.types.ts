import { ReactNode } from 'react';

export interface TooltipProps {
  label: string;
  children: ReactNode;
  side?: 'top' | 'bottom';
  align?: 'start' | 'center';
}
