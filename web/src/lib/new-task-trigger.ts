import { useCreateTaskStore } from '@/stores/create-task.store';
import { NEW_TASK_SHORTCUT_SELECTOR } from '@/config/app.constants';

export const triggerNewTask = (): void => {
  const button = document.querySelector<HTMLButtonElement>(NEW_TASK_SHORTCUT_SELECTOR);
  if (button) button.click();
  else useCreateTaskStore.getState().show({ listId: null });
};
