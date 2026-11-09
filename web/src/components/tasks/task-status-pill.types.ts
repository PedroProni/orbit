import { StatusDefinition } from '@/types/api.types';

export interface TaskStatusPillProps {
  statuses: StatusDefinition[];
  value: string;
  readOnly: boolean;
  onChange: (status: string) => void;
}
