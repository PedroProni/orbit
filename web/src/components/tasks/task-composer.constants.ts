import { TaskPriority } from '@/types/api.types';
import { ComposerDraft, ComposerPresets } from './task-composer.types';

export const EMPTY_PRESETS: ComposerPresets = { assigneeIds: [], priority: null, tags: [] };
export const EMPTY_DRAFT: ComposerDraft = { title: '', listId: null, assigneeIds: [], priority: null, tags: [], startDate: '', dueDate: '', points: null, taskKind: null, customFields: [] };
export const TEMP_TASK_PREFIX = 'temp-';
export const COMPOSER_PRIORITY_KEYS: Record<string, TaskPriority | null> = { '1': 'urgent', '2': 'high', '3': 'normal', '4': 'low', '0': null };
