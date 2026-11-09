import { create } from 'zustand';
import { FavoritesState, FavoriteTask } from '@/stores/favorites.types';
import { FAVORITE_TASKS_STORAGE_KEY, FAVORITES_STORAGE_KEY } from '@/config/app.constants';

const persist = (listIds: string[]) => window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(listIds));
const persistTasks = (tasks: FavoriteTask[]) => window.localStorage.setItem(FAVORITE_TASKS_STORAGE_KEY, JSON.stringify(tasks));
const readTasks = (): FavoriteTask[] => {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(FAVORITE_TASKS_STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((item): item is FavoriteTask => typeof item?.id === 'string' && typeof item?.title === 'string') : [];
  } catch {
    return [];
  }
};

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  listIds: [],
  tasks: [],
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    set({ listIds: raw ? (JSON.parse(raw) as string[]) : [], tasks: readTasks(), hydrated: true });
  },
  toggle: (listId) => {
    const current = get().listIds;
    const next = current.includes(listId) ? current.filter((id) => id !== listId) : [...current, listId];
    persist(next);
    set({ listIds: next });
  },
  toggleTask: (task) => {
    const current = get().hydrated ? get().tasks : readTasks();
    const next = current.some((item) => item.id === task.id) ? current.filter((item) => item.id !== task.id) : [...current, task];
    persistTasks(next);
    set({ tasks: next });
  },
  renameTask: (task) => {
    const current = get().tasks;
    if (!current.some((item) => item.id === task.id && item.title !== task.title)) return;
    const next = current.map((item) => (item.id === task.id ? task : item));
    persistTasks(next);
    set({ tasks: next });
  },
}));
