import { TaskPriority } from '@/types/api.types';

export const TEMPLATE_NAME_MAX_LENGTH = 80;
export const TEMPLATE_TITLE_MAX_LENGTH = 300;
export const TEMPLATE_DESCRIPTION_MAX_LENGTH = 20000;
export const TEMPLATE_ESTIMATE_MAX_MINUTES = 600000;
export const TEMPLATE_PRIORITIES: TaskPriority[] = ['urgent', 'high', 'normal', 'low'];
export const TEMPLATE_NO_PRIORITY = '';
export const TEMPLATE_TAG_SEPARATOR = ',';
