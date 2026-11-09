'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useInbox } from '@/hooks/use-workspace';
import { useUiStore } from '@/stores/ui.store';
import { Task } from '@/types/api.types';

function Section({ title, tasks, empty }: { title: string; tasks: Task[]; empty: string }) {
  const openTask = useUiStore((s) => s.openTask);
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-sm font-semibold uppercase text-muted">{title}</h2>
      {tasks.length === 0 ? <p className="text-sm text-muted">{empty}</p> : null}
      <ul className="space-y-1">
        {tasks.map((task) => (
          <li key={task.id}>
            <Link href={`/lists/${task.listId}`} onClick={() => openTask(task.id)} className="block rounded border border-line px-3 py-2 text-sm hover:bg-panel2">
              {task.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function InboxScreen() {
  const t = useTranslations('inbox');
  const inbox = useInbox();
  if (inbox.isLoading) return <p className="p-6 text-sm text-muted">{t('loading')}</p>;
  if (!inbox.data) return <p className="p-6 text-sm text-danger">{t('error')}</p>;
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-xl font-semibold">{t('title')}</h1>
      <div className="mb-6 flex gap-4 text-sm">
        <span className="rounded border border-line px-3 py-1">{t('unread', { count: inbox.data.unreadNotifications })}</span>
        <span className="rounded border border-line px-3 py-1">{t('assigned', { count: inbox.data.assignedOpen })}</span>
      </div>
      <Section title={t('overdue')} tasks={inbox.data.overdue} empty={t('emptyOverdue')} />
      <Section title={t('dueSoon')} tasks={inbox.data.dueSoon} empty={t('emptyDueSoon')} />
    </div>
  );
}
