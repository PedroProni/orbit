import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui/empty-state';

export function AccessDenied() {
  const t = useTranslations('common');
  return (
    <div className="p-6">
      <EmptyState title={t('accessDenied')} hint={t('accessDeniedHint')} />
      <p className="mt-3 text-center text-sm">
        <Link href="/" className="text-accent">
          {t('backHome')}
        </Link>
      </p>
    </div>
  );
}
