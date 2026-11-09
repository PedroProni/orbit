import { Attachment } from '@/types/api.types';

export interface TaskPrintsSlotProps {
  taskId: string;
  readOnly: boolean;
  folder: string | null;
  onSaveFolder: (value: string | null) => void;
}

export interface PrintThumbProps {
  print: Attachment;
  readOnly: boolean;
  onRemove: (id: string) => void;
}
