import { ViewMode } from '@/stores/ui.types';

export const SHORTCUT_CHORD_MS = 1200;
export const SHORTCUT_VIEW_KEYS: Record<string, ViewMode> = { l: 'list', b: 'board', t: 'table', c: 'calendar', m: 'timeline', w: 'workload' };
export const WIDGET_KEY_ROLES = '[role="combobox"], [role="grid"], [role="menu"]';
