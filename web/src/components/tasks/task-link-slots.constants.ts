import { PullRequestState } from '@/types/api.types';

export const TASK_LINK_URL_PATTERN = /^https?:\/\/\S+$/i;
export const TASK_LINK_MAX_LENGTH = 2048;
export const FIELD_ROW_CLASS = 'grid min-h-8 grid-cols-[minmax(0,7rem)_minmax(0,1fr)] items-start gap-2 py-1 pl-1 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]';
export const PULL_REQUEST_LINK_CLASS = 'min-w-0 text-accent [overflow-wrap:anywhere] hover:underline';
export const PULL_REQUEST_TITLE_CLASS = 'min-w-0 shrink-[100] truncate';
export const SLOT_ADD_CLASS = 'rounded px-1.5 py-0.5 text-left text-muted transition-colors hover:bg-panel2 hover:text-fg';
export const PULL_REQUEST_STATE_CLASS: Record<PullRequestState, string> = {
  open: 'text-emerald-500',
  merged: 'text-violet-500',
  closed: 'text-red-500',
};
export const PRINT_IMAGE_ACCEPT = 'image/*';
export const URL_PROTOCOL_PATTERN = /^https?:\/\//i;
