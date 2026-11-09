import { TaskFilters } from '@/types/api.types';
import { VIEW_MODES } from '@/components/tasks/tasks.constants';
import { ViewDisplay } from '@/types/view-display.types';

export type ViewMode = (typeof VIEW_MODES)[number];

export interface UiState {
  view: ViewMode;
  filters: TaskFilters;
  display: ViewDisplay;
  activeViewId: string | null;
  openTaskId: string | null;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  paletteOpen: boolean;
  setView: (view: ViewMode) => void;
  setFilters: (filters: Partial<TaskFilters>) => void;
  setDisplay: (display: Partial<ViewDisplay>) => void;
  applyView: (id: string | null, view: ViewMode, filters: TaskFilters, display: ViewDisplay) => void;
  openTask: (id: string | null) => void;
  toggleSidebar: (open?: boolean) => void;
  toggleCollapsed: () => void;
  setPaletteOpen: (open: boolean) => void;
}
