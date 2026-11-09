import { create } from 'zustand';
import { RecentListsState } from '@/stores/recent-lists.types';
import { RECENT_LISTS_MAX, RECENT_LISTS_STORAGE_KEY } from '@/config/app.constants';

const read = (): string[] => {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(RECENT_LISTS_STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string').slice(0, RECENT_LISTS_MAX) : [];
  } catch {
    return [];
  }
};

export const useRecentListsStore = create<RecentListsState>((set, get) => ({
  listIds: [],
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    set({ listIds: read(), hydrated: true });
  },
  remember: (listId) => {
    const next = [listId, ...read().filter((id) => id !== listId)].slice(0, RECENT_LISTS_MAX);
    window.localStorage.setItem(RECENT_LISTS_STORAGE_KEY, JSON.stringify(next));
    set({ listIds: next, hydrated: true });
  },
}));
