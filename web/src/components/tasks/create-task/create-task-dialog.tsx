'use client';

import { useCapabilities } from '@/hooks/use-capabilities';
import { useCreateTaskStore } from '@/stores/create-task.store';
import { CreateTaskForm } from './create-task-form';

export function CreateTaskDialog() {
  const { member } = useCapabilities();
  const open = useCreateTaskStore((s) => s.open);
  const session = useCreateTaskStore((s) => s.session);
  const defaults = useCreateTaskStore((s) => s.defaults);
  const hide = useCreateTaskStore((s) => s.hide);
  if (!member || session === 0) return null;
  return <CreateTaskForm key={session} open={open} defaults={defaults} onHide={hide} />;
}
