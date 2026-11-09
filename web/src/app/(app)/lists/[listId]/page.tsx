import { ListScreen } from '@/components/tasks/list-screen';

export default async function ListPage({ params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params;
  return <ListScreen listId={listId} />;
}
