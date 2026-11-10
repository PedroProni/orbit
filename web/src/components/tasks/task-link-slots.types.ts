import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Task } from '@/types/api.types';
import { SaveTaskPatch } from './task-field.types';

export interface TaskFieldRowProps {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}

export interface TaskUrlSlotProps {
  label: string;
  addLabel: string;
  value: string | null;
  readOnly: boolean;
  onSave: (value: string | null) => void;
}

export interface TaskSlotProps {
  taskId: string;
  readOnly: boolean;
}

export interface TaskFieldsSectionProps {
  task: Task;
  readOnly: boolean;
  limited: boolean;
  save: SaveTaskPatch;
}
