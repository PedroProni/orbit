export const INLINE_FILES_MIGRATION_NAME = 'inline-files-to-attachments';
export const INLINE_FILE_URL_GLOBAL_PATTERN = /https?:\/\/[^\s)"'\]]*clickup-attachments\.com\/[^\s)"'\]]+/g;
export const IMAGE_MIME_PREFIX = 'image/';
export const LABEL_FORBIDDEN_PATTERN = /[[\]()\\!]/g;
export const LABEL_REPEATED_SPACE_PATTERN = /\s+/g;
export const FALLBACK_LABEL = 'arquivo';
export const FILE_HOST_FILTER = { $regex: 'clickup-attachments\\.com' };
export const COMMENT_AUDIT_ACTION = 'comment.updated';
