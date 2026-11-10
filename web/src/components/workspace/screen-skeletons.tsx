'use client';

import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { RowsSkeletonProps } from './screens.types';

export function DashboardsSkeleton() {
  const t = useTranslations('ui');
  return (
    <div role="status" aria-label={t('loading')} className="space-y-4 p-4">
      <Skeleton height={28} width={220} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} height={180} />
        ))}
      </div>
    </div>
  );
}

export function DocsSkeleton() {
  const t = useTranslations('ui');
  return (
    <div role="status" aria-label={t('loading')} className="grid gap-4 p-4 md:grid-cols-[260px_minmax(0,1fr)]">
      <div className="space-y-2">
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={i} height={22} width={`${90 - i * 7}%`} />
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton height={32} width="50%" />
        <Skeleton height={320} />
      </div>
    </div>
  );
}

export function WidgetsSkeleton() {
  const t = useTranslations('ui');
  return (
    <div role="status" aria-label={t('loading')} className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} height={200} />
      ))}
    </div>
  );
}

export function RowsSkeleton({ rows }: RowsSkeletonProps) {
  const t = useTranslations('ui');
  return (
    <div role="status" aria-label={t('loading')} className="space-y-2">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} height={44} />
      ))}
    </div>
  );
}

export function DocBodySkeleton() {
  const t = useTranslations('ui');
  return (
    <div role="status" aria-label={t('loading')} className="mx-auto max-w-4xl space-y-3">
      <Skeleton height={32} width="50%" />
      <Skeleton height={320} />
    </div>
  );
}
