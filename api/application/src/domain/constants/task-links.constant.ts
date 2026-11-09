import { TaskLinkKey } from '@domain/types/task-link-key.type';
import { TaskLinks } from '@domain/types/task-links.type';

export const EMPTY_TASK_LINKS: Readonly<TaskLinks> = { figma: null, notion: null, printsFolder: null };
export const TASK_LINK_KEYS: readonly TaskLinkKey[] = ['figma', 'notion', 'printsFolder'];
export const TASK_LINK_MAX_LENGTH = 2048;
export const TASK_LINK_URL_PATTERN = /^https?:\/\/[^\s/$.?#][^\s]*$/i;
