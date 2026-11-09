import { DARK_CLASS, DARK_THEME, LIGHT_THEME, REDUCED_MOTION_QUERY, THEME_STORAGE_KEY } from '@/config/theme.constants';

export const isDarkTheme = (): boolean => document.documentElement.classList.contains(DARK_CLASS);

const storeTheme = (dark: boolean): void => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, dark ? DARK_THEME : LIGHT_THEME);
  } catch {
    return;
  }
};

export function applyTheme(dark: boolean): void {
  const apply = () => {
    document.documentElement.classList.toggle(DARK_CLASS, dark);
    storeTheme(dark);
  };
  const reduced = window.matchMedia?.(REDUCED_MOTION_QUERY).matches ?? false;
  if (reduced || typeof document.startViewTransition !== 'function') {
    apply();
    return;
  }
  document.startViewTransition(apply);
}
