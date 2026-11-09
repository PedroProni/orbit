import { DEFAULT_DISPLAY } from '@/stores/ui.constants';
import { ViewMode } from '@/stores/ui.types';
import { SavedView, TaskFilters } from '@/types/api.types';
import { ViewDisplay } from '@/types/view-display.types';

const sorted = (values: string[]): string[] => [...values].sort();

const normalizedFilters = (filters: TaskFilters) => ({ statuses: sorted(filters.statuses), assigneeIds: sorted(filters.assigneeIds), tags: sorted(filters.tags), q: filters.q, includeClosed: filters.includeClosed, unassigned: !!filters.unassigned });

const normalizedDisplay = (display: ViewDisplay) => ({ ...display, cardFields: sorted(display.cardFields), collapsedColumns: sorted(display.collapsedColumns), wipLimits: [...display.wipLimits].sort((a, b) => a.column.localeCompare(b.column)) });

export const displayOf = (saved: SavedView): ViewDisplay => ({ ...DEFAULT_DISPLAY, ...(saved.display ?? {}) });

export const viewIsDirty = (saved: SavedView, view: ViewMode, filters: TaskFilters, display: ViewDisplay): boolean =>
  saved.viewType !== view || JSON.stringify(normalizedFilters(saved.filters)) !== JSON.stringify(normalizedFilters(filters)) || JSON.stringify(normalizedDisplay(displayOf(saved))) !== JSON.stringify(normalizedDisplay(display));
