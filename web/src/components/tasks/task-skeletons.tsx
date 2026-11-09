'use client';

import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';

export function ListSkeleton({ rows = 8 }: { rows?: number }) {
  const t = useTranslations('ui');
  return (
    <div role="status" aria-label={t('loading')} className="space-y-1">
      <Skeleton height={28} width={180} className="mb-2" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-1.5">
          <Skeleton height={14} width={14} className="rounded-full" />
          <Skeleton height={14} className="flex-1" />
          <Skeleton height={14} width={60} />
          <Skeleton height={14} width={90} />
        </div>
      ))}
    </div>
  );
}

export function BoardSkeleton({ columns = 4 }: { columns?: number }) {
  const t = useTranslations('ui');
  return (
    <div role="status" aria-label={t('loading')} className="flex gap-3 overflow-hidden">
      {Array.from({ length: columns }, (_, c) => (
        <div key={c} className="w-72 shrink-0 space-y-2 rounded-lg bg-panel p-2">
          <Skeleton height={24} width={120} />
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} height={72} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function PanelSkeleton({ height = 240 }: { height?: number }) {
  const t = useTranslations('ui');
  return <Skeleton height={height} className="w-full" aria-label={t('loading')} />;
}
