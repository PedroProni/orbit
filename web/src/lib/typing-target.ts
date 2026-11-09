import { WIDGET_KEY_ROLES } from '@/hooks/use-shortcuts.constants';

export const isTyping = (target: EventTarget | null): boolean => {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable || Boolean(el.closest?.(WIDGET_KEY_ROLES));
};
