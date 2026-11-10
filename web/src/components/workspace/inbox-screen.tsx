'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ErrorState } from '@/components/ui/error-state';
import { PageHeader } from '@/components/ui/page-header';
import { useInbox } from '@/hooks/use-workspace';
import { useUiStore } from '@/stores/ui.store';
import { RowsSkeleton } from './screen-skeletons';
import { SCREEN_NARROW_CLASS } from './screens.constants';
import { InboxSectionProps } from './screens.types';

function Section({ title, tasks, empty }: InboxSectionProps) {
  const openTask = useUiStore((s) => s.openTask);
  return (
    <section aria-label={title} className="mb-6">
      <h2 className="mb-2 text-sm font-semibold uppercase text-muted">{title}</h2>
      {tasks.length === 0 ? <p className="text-sm text-muted">{empty}</p> : null}
      <ul className="space-y-1">
        {tasks.map((task) => (
          <li key={task.id}>
            <Link href={`/lists/${task.listId}`} onClick={() => openTask(task.id)} className="block break-words rounded border border-line px-3 py-2 text-sm hover:bg-panel2">
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
  return (
    <div className={SCREEN_NARROW_CLASS}>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      {inbox.isLoading ? <RowsSkeleton rows={4} /> : null}
      {!inbox.isLoading && !inbox.data ? <ErrorState title={t('error')} onRetry={inbox.refetch} /> : null}
      {inbox.data ? (
        <>
          <div className="mb-6 flex flex-wrap gap-2 text-sm">
            <span className="rounded border border-line px-3 py-1">{t('unread', { count: inbox.data.unreadNotifications })}</span>
            <span className="rounded border border-line px-3 py-1">{t('assigned', { count: inbox.data.assignedOpen })}</span>
          </div>
          <Section title={t('overdue')} tasks={inbox.data.overdue} empty={t('emptyOverdue')} />
          <Section title={t('dueSoon')} tasks={inbox.data.dueSoon} empty={t('emptyDueSoon')} />
        </>
      ) : null}
    </div>
  );
}
