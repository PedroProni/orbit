import { TaskPriority } from '@/types/api.types';

export const BOARD_NONE_KEY = '__none__';
export const BOARD_NO_LANE = '__all__';
export const BOARD_PRIORITY_KEYS: Array<TaskPriority | typeof BOARD_NONE_KEY> = ['urgent', 'high', 'normal', 'low', BOARD_NONE_KEY];
export const PRIORITY_RANK: Record<TaskPriority, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
export const BOARD_DRAG_SEPARATOR = '::';
