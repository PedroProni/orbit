import { StatusDefinition } from '@/types/api.types';

export interface TableStatusCellProps {
  statuses: StatusDefinition[];
  value: string;
  readOnly: boolean;
  onChange: (status: string) => void;
}
