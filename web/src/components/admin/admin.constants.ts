import { Bot, CalendarDays, FileText, FolderTree, KeyRound, LayoutTemplate, Link2, ListChecks, ListFilter, Shapes, SlidersHorizontal, Users, UsersRound } from 'lucide-react';
import { CustomFieldType, StatusType } from '@/types/api.types';

export const ADMIN_SECTIONS = [
  {
    group: 'people',
    items: [
      { href: '/admin/people', key: 'people', icon: Users },
      { href: '/admin/groups', key: 'groups', icon: UsersRound },
    ],
  },
  {
    group: 'structure',
    items: [
      { href: '/admin/spaces', key: 'spaces', icon: FolderTree },
      { href: '/admin/statuses', key: 'statuses', icon: ListChecks },
      { href: '/admin/custom-fields', key: 'customFields', icon: SlidersHorizontal },
      { href: '/admin/task-types', key: 'taskTypes', icon: Shapes },
      { href: '/admin/templates', key: 'templates', icon: LayoutTemplate },
    ],
  },
  {
    group: 'automation',
    items: [
      { href: '/admin/automations', key: 'automations', icon: Bot },
      { href: '/admin/forms', key: 'forms', icon: FileText },
    ],
  },
  { group: 'integrations', items: [{ href: '/admin/api-tokens', key: 'apiTokens', icon: KeyRound }] },
] as const;

export const ADMIN_NAV_ACTIVE_SELECTOR = '[aria-current="page"]';
export const ADMIN_NAV_SCROLL: ScrollIntoViewOptions = { block: 'nearest', inline: 'center' };
export const ADMIN_HOME = '/admin/people';
export const ADMIN_PAGE_CLASS = 'mx-auto max-w-4xl p-4 md:p-6';
export const ADMIN_PANEL_CLASS = 'rounded-xl border border-line bg-panel';
export const ADMIN_DIALOG_PANEL_CLASS = 'w-full max-w-md rounded-xl border border-linestrong bg-raised p-5 shadow-floating';
export const ADMIN_PRIMARY_BUTTON_CLASS = 'flex items-center gap-1 rounded bg-accent px-3 py-2 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60';
export const ADMIN_SECONDARY_BUTTON_CLASS = 'flex items-center gap-1 rounded border border-line px-3 py-2 text-sm text-muted transition-colors hover:text-fg';
export const ADMIN_DANGER_BUTTON_CLASS = 'rounded bg-danger px-3 py-2 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60';
export const ADMIN_ICON_BUTTON_CLASS = 'rounded p-1 text-muted transition-colors hover:bg-panel2 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40';
export const ADMIN_FIELD_CLASS = 'w-full rounded border border-line bg-panel2 px-3 py-2 text-sm';
export const ADMIN_LABEL_CLASS = 'mb-1 block text-xs text-muted';
export const ADMIN_NAME_MAX_LENGTH = 120;
export const GROUP_NAME_MAX_LENGTH = 60;
export const FIELD_NAME_MAX_LENGTH = 80;
export const MAX_STATUSES = 30;
export const STATUS_COLOR_CHOICES = ['#64748b', '#60a5fa', '#06b6d4', '#14b8a6', '#22c55e', '#f5a524', '#f97316', '#ef4444', '#ec4899', '#a855f7'] as const;
export const EXTRA_STATUS_STAGES: StatusType[] = ['open', 'active', 'review', 'done', 'closed'];
export const CUSTOM_FIELD_TYPES: CustomFieldType[] = ['dropdown', 'url', 'date'];
export const TASK_KINDS = ['task', 'milestone', 'bug', 'feature', 'chore'] as const;
export const NO_FOLDER = '';
export const STATUS_NAME_MAX_LENGTH = 60;
export const DEFAULT_STATUS_COUNT = 7;
export const CUSTOM_FIELD_ICONS = { dropdown: ListFilter, url: Link2, date: CalendarDays } as const;
export const ADMIN_WIDE_DIALOG_PANEL_CLASS = 'flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-linestrong bg-raised shadow-floating';
export const ADMIN_BADGE_CLASS = 'shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium';
