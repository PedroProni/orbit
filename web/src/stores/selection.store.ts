import { create } from 'zustand';
import { SelectionState } from '@/stores/selection.types';

export const useSelectionStore = create<SelectionState>((set) => ({
  ids: [],
  toggle: (id) => set((state) => ({ ids: state.ids.includes(id) ? state.ids.filter((value) => value !== id) : [...state.ids, id] })),
  set: (ids) => set({ ids }),
  clear: () => set({ ids: [] }),
}));
