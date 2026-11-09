import { BarChart3, FileText, Inbox, LayoutGrid, MessageSquare, Settings, Target } from 'lucide-react';

export const ALL_TASKS_NAV_ITEM = { href: '/all-tasks', key: 'allTasks', icon: LayoutGrid } as const;

export const NAV_ITEMS = [
  { href: '/inbox', key: 'inbox', icon: Inbox },
  { href: '/docs', key: 'docs', icon: FileText },
  { href: '/goals', key: 'goals', icon: Target },
  { href: '/dashboards', key: 'dashboards', icon: BarChart3 },
  { href: '/chat', key: 'chat', icon: MessageSquare },
] as const;

export const ADMIN_NAV_ITEMS = [{ href: '/admin/people', key: 'admin', icon: Settings }] as const;
export const SPACE_CREATE_TRIGGER_CLASS = 'ml-0.5 shrink-0 rounded p-1 text-muted transition-opacity hover:bg-panel2 hover:text-fg md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100';
export const NEW_SPACE_BUTTON_CLASS = 'mb-2 flex w-full items-center gap-2 rounded px-2 py-1 text-sm text-muted transition-colors hover:bg-panel2 hover:text-fg';

export const SPACE_COLORS = ['#7c6cff', '#06b6d4', '#22c55e', '#f5a524', '#e5484d', '#ec4899', '#a855f7', '#14b8a6'];
