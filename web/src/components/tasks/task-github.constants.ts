import { CircleCheck, CircleDot, CircleX, LucideIcon } from 'lucide-react';
import { GithubChecksState } from '@/types/api.types';

export const GITHUB_AVATAR_URL_PATTERN = /^https:\/\/avatars\.githubusercontent\.com\//;
export const GITHUB_LINK_URL_PATTERN = /^https:\/\/github\.com\//;
export const GITHUB_NOW_UPDATE_MS = 60000;
export const GITHUB_SHORT_SHA_LENGTH = 7;
export const GITHUB_UNAVAILABLE_STATUS = 503;
export const GITHUB_UNAVAILABLE_ERROR_KEY = 'githubUnavailable';
export const GITHUB_META_CLASS = 'flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 pl-5 text-xs text-muted';
export const GITHUB_REF_TOGGLE_CLASS = 'flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted transition-colors hover:bg-panel2 hover:text-fg';
export const GITHUB_REF_LINK_CLASS = 'min-w-0 truncate text-accent hover:underline';
export const GITHUB_DRAFT_CLASS = 'shrink-0 rounded border border-line px-1 text-[10px] uppercase leading-4 text-muted';
export const GITHUB_CHECKS_ICON: Record<Exclude<GithubChecksState, 'none'>, LucideIcon> = {
  success: CircleCheck,
  failure: CircleX,
  pending: CircleDot,
};
export const GITHUB_CHECKS_CLASS: Record<Exclude<GithubChecksState, 'none'>, string> = {
  success: 'text-emerald-500',
  failure: 'text-red-500',
  pending: 'text-amber-500',
};
