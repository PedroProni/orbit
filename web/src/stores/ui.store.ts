import { create } from 'zustand';
import { DEFAULT_DISPLAY, EMPTY_FILTERS } from '@/stores/ui.constants';
import { UiState } from '@/stores/ui.types';

export const useUiStore = create<UiState>((set) => ({
  view: 'list',
  filters: EMPTY_FILTERS,
  display: DEFAULT_DISPLAY,
  activeViewId: null,
  openTaskId: null,
  sidebarOpen: false,
  sidebarCollapsed: false,
  paletteOpen: false,
  setView: (view) => set({ view }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  setDisplay: (display) => set((state) => ({ display: { ...state.display, ...display } })),
  applyView: (activeViewId, view, filters, display) => set({ activeViewId, view, filters, display }),
  openTask: (openTaskId) => set({ openTaskId }),
  toggleSidebar: (open) => set((state) => ({ sidebarOpen: open ?? !state.sidebarOpen })),
  toggleCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
}));
