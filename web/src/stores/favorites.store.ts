import { create } from 'zustand';
import { FavoritesState } from '@/stores/favorites.types';
import { FAVORITES_STORAGE_KEY } from '@/config/app.constants';

const persist = (listIds: string[]) => window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(listIds));

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  listIds: [],
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    set({ listIds: raw ? (JSON.parse(raw) as string[]) : [], hydrated: true });
  },
  toggle: (listId) => {
    const current = get().listIds;
    const next = current.includes(listId) ? current.filter((id) => id !== listId) : [...current, listId];
    persist(next);
    set({ listIds: next });
  },
}));
