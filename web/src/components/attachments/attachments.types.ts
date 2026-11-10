import { Attachment } from '@/types/api.types';

export type UploadStatus = 'uploading' | 'done' | 'error';

export interface UploadItem {
  id: string;
  name: string;
  progress: number;
  status: UploadStatus;
  errorKey: string | null;
  errorValues: Record<string, string>;
}

export interface UploadController {
  uploads: UploadItem[];
  start: (files: File[], commentId?: string) => Promise<void>;
  dismiss: (id: string) => void;
}

export interface TaskAttachmentsProps {
  taskId: string;
  controller: UploadController;
  readOnly?: boolean;
}

export interface AttachmentItemProps {
  attachment: Attachment;
  onRemove?: (id: string) => void;
}

export interface FileValidation {
  errorKey: string | null;
  values: Record<string, string>;
}
