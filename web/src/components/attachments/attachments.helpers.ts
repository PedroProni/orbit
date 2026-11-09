import { API_BASE } from '@/config/app.constants';
import { ATTACHMENT_BLOCKED_EXTENSIONS, ATTACHMENT_DEFAULT_MIME, ATTACHMENT_MAX_BYTES } from './attachments.constants';
import { FileValidation } from './attachments.types';

export const extensionOf = (name: string): string => (name.includes('.') ? (name.split('.').pop() ?? '').toLowerCase() : '');

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

export const isImageMime = (mime: string): boolean => mime.startsWith('image/');

export const mimeOf = (file: File): string => file.type || ATTACHMENT_DEFAULT_MIME;

export function validateFile(file: File): FileValidation {
  if (file.size === 0) return { errorKey: 'empty', values: { name: file.name } };
  if (file.size > ATTACHMENT_MAX_BYTES) return { errorKey: 'tooLarge', values: { name: file.name, max: formatBytes(ATTACHMENT_MAX_BYTES) } };
  if (ATTACHMENT_BLOCKED_EXTENSIONS.includes(extensionOf(file.name))) return { errorKey: 'blockedType', values: { name: file.name, ext: extensionOf(file.name) } };
  return { errorKey: null, values: {} };
}

export const attachmentContentUrl = (id: string): string => `${API_BASE}/attachments/${id}/content`;
