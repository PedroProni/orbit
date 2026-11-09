import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

export interface TaskPropertyRowProps {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}
