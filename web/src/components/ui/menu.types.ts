import { ReactNode } from 'react';

export interface MenuItem {
  key: string;
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  onSelect: () => void;
}

export interface MenuListProps {
  items: MenuItem[];
  onClose: () => void;
  label?: string;
}

export interface DropdownMenuProps {
  items: MenuItem[];
  label: string;
  children: ReactNode;
  className?: string;
}
