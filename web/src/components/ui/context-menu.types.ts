import { ReactNode } from 'react';
import { MenuItem } from './menu.types';

export interface ContextMenuProps {
  items: MenuItem[];
  children: ReactNode;
  className?: string;
  as?: 'div' | 'li';
  motionKey?: string;
}
