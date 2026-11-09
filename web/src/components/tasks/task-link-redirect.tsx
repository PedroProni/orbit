'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTask } from '@/hooks/use-orbit';
import { EmptyState } from '@/components/ui/empty-state';
import { ListSkeleton } from './task-skeletons';
import { TaskLinkRedirectProps } from './task-link-redirect.types';

export function TaskLinkRedirect({ taskId }: TaskLinkRedirectProps) {
  const t = useTranslations('tasks');
  const tc = useTranslations('common');
  const router = useRouter();
  const task = useTask(taskId);
  const listId = task.data?.listId;
  useEffect(() => {
    if (listId) router.replace(`/lists/${listId}?task=${taskId}`);
  }, [listId, taskId, router]);
  if (task.isError) {
    return (
      <div className="p-6">
        <EmptyState title={t('linkNotFound')} hint={t('linkNotFoundHint')} />
        <p className="mt-3 text-center text-sm">
          <Link href="/" className="text-accent">
            {tc('backHome')}
          </Link>
        </p>
      </div>
    );
  }
  return (
    <div className="p-6">
      <ListSkeleton />
    </div>
  );
}
