'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useCapabilities, useMe } from '@/hooks/use-capabilities';
import { cn } from '@/lib/cn';
import { ADMIN_SECTIONS } from './admin.constants';
import { AdminShellProps } from './admin.types';

export function AdminShell({ children }: AdminShellProps) {
  const t = useTranslations('admin');
  const tc = useTranslations('common');
  const pathname = usePathname();
  const me = useMe();
  const caps = useCapabilities();

  if (me.isLoading) return <Skeleton className="m-6 h-40" />;
  if (!caps.canManageStructure) {
    return (
      <div className="p-6">
        <EmptyState title={tc('accessDenied')} hint={t('deniedHint')} />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col md:flex-row">
      <nav aria-label={t('navLabel')} className="shrink-0 border-b border-line p-3 md:w-56 md:border-b-0 md:border-r">
        <p className="mb-2 hidden px-2 text-sm font-semibold md:block">{t('title')}</p>
        <div className="flex gap-4 overflow-x-auto md:block md:space-y-4">
          {ADMIN_SECTIONS.map((section) => (
            <div key={section.group} className="shrink-0">
              <p className="mb-1 px-2 text-[11px] uppercase text-muted">{t(`groups.${section.group}`)}</p>
              <ul className="flex gap-1 md:block md:space-y-0.5">
                {section.items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link href={item.href} aria-current={active ? 'page' : undefined} className={cn('flex items-center gap-2 whitespace-nowrap rounded px-2 py-1 text-sm transition-colors', active ? 'bg-accentsoft text-fg' : 'text-muted hover:bg-panel2 hover:text-fg')}>
                        <item.icon size={14} />
                        {t(`sections.${item.key}`)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>
      <div className="min-w-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
