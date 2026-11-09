import { TaskLinkRedirect } from '@/components/tasks/task-link-redirect';

export default async function TaskLinkPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  return <TaskLinkRedirect taskId={taskId} />;
}
