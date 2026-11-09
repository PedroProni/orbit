import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';

export function SidebarSkeleton() {
  const t = useTranslations('sidebar');
  return (
    <div className="space-y-2 px-2">
      <span className="sr-only">{t('loading')}</span>
      {Array.from({ length: 3 }, (_, g) => (
        <div key={g} className="space-y-1.5">
          <Skeleton height={20} width="70%" />
          <Skeleton height={16} width="85%" className="ml-4" />
          <Skeleton height={16} width="60%" className="ml-4" />
        </div>
      ))}
    </div>
  );
}
