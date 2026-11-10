import { Task } from '@/types/api.types';

export interface RowsSkeletonProps {
  rows: number;
}

export interface InboxSectionProps {
  title: string;
  tasks: Task[];
  empty: string;
}
