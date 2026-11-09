import { DEFAULT_DISPLAY } from '@/stores/ui.constants';
import { VIEW_DISPLAY_STORAGE_PREFIX } from '@/config/app.constants';
import { ViewDisplay } from '@/types/view-display.types';

const keyOf = (listId: string): string => `${VIEW_DISPLAY_STORAGE_PREFIX}${listId}`;

export function loadViewDisplay(listId: string): ViewDisplay {
  const raw = window.localStorage.getItem(keyOf(listId));
  if (!raw) return DEFAULT_DISPLAY;
  try {
    return { ...DEFAULT_DISPLAY, ...(JSON.parse(raw) as Partial<ViewDisplay>) };
  } catch {
    return DEFAULT_DISPLAY;
  }
}

export function saveViewDisplay(listId: string, display: ViewDisplay): void {
  window.localStorage.setItem(keyOf(listId), JSON.stringify(display));
}
