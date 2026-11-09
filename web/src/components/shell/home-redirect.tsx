'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useHierarchy } from '@/hooks/use-orbit';
import { ListSkeleton } from '@/components/tasks/task-skeletons';

export function HomeRedirect() {
  const t = useTranslations('sidebar');
  const router = useRouter();
  const hierarchy = useHierarchy();
  const first = hierarchy.data?.flatMap((s) => s.lists)[0];
  useEffect(() => {
    if (first) router.replace(`/lists/${first.id}`);
  }, [first, router]);
  if (hierarchy.data && !first) return <p className="p-6 text-sm text-muted">{t('empty')}</p>;
  return (
    <div className="p-6">
      <ListSkeleton />
    </div>
  );
}
