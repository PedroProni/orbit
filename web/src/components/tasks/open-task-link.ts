import { useUiStore } from '@/stores/ui.store';

export function openTaskLink(push: (href: string) => void, target: string, taskId?: string): void {
  const url = new URL(target, window.location.origin);
  if (taskId && url.pathname === window.location.pathname) useUiStore.getState().openTask(taskId);
  else push(target);
}
