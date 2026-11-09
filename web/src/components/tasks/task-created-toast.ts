import { useToastStore } from '@/stores/toast.store';
import { Task } from '@/types/api.types';
import { taskLinkPath, taskListPath } from './task-link.helpers';

export function announceCreated(task: Pick<Task, 'id' | 'title' | 'listId'>, listName: string): void {
  useToastStore.getState().push(
    'success',
    listName ? 'taskCreatedIn' : 'created',
    { name: task.title, list: listName },
    {
      actions: [
        { kind: 'open', hotkey: '1', labelKey: 'viewTask', target: taskListPath(task.listId, task.id), taskId: task.id },
        { kind: 'copy', hotkey: '2', labelKey: 'copyUrl', target: `${window.location.origin}${taskLinkPath(task.id)}` },
      ],
    },
  );
}
