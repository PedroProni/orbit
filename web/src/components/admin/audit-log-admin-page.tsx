'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuditLog } from '@/hooks/use-audit-log';
import { useCapabilities } from '@/hooks/use-capabilities';
import { useUiStore } from '@/stores/ui.store';
import { ADMIN_PANEL_CLASS, ADMIN_SECONDARY_BUTTON_CLASS } from './admin.constants';
import { AdminPageFrame } from './admin-page-frame';
import { AuditLogFilters } from './audit-log-filters';
import { EMPTY_AUDIT_DRAFT } from './audit-log.constants';
import { isAuditRangeInvalid, toAuditFilters } from './audit-log.helpers';
import { AuditLogRow } from './audit-log-row';

export function AuditLogAdminPage() {
  const t = useTranslations('admin');
  const tc = useTranslations('common');
  const { canReadAudit } = useCapabilities();
  const openTask = useUiStore((s) => s.openTask);
  const [draft, setDraft] = useState(EMPTY_AUDIT_DRAFT);
  const invalidRange = isAuditRangeInvalid(draft);
  const [applied, setApplied] = useState(toAuditFilters(EMPTY_AUDIT_DRAFT));
  const logs = useAuditLog(applied);
  const items = useMemo(() => logs.data?.pages.flatMap((page) => page.items) ?? [], [logs.data]);

  const change = (next: typeof draft) => {
    setDraft(next);
    if (!isAuditRangeInvalid(next)) setApplied(toAuditFilters(next));
  };

  if (!canReadAudit) return <EmptyState title={tc('accessDenied')} hint={t('deniedHint')} />;

  return (
    <AdminPageFrame title={t('sections.auditLog')} subtitle={t('auditLog.subtitle')}>
      <AuditLogFilters draft={draft} invalidRange={invalidRange} onChange={change} />
      <section aria-label={t('sections.auditLog')} className={ADMIN_PANEL_CLASS}>
        {logs.isLoading ? <Skeleton className="m-3 h-16" /> : null}
        {logs.isError ? <EmptyState title={t('loadError')} /> : null}
        {logs.isSuccess && items.length === 0 ? <EmptyState title={t('auditLog.empty')} hint={t('auditLog.emptyHint')} /> : null}
        <ul className="divide-y divide-line">
          {items.map((item) => (
            <AuditLogRow key={item.id} item={item} onOpenTask={openTask} />
          ))}
        </ul>
      </section>
      {logs.hasNextPage ? (
        <div className="mt-3 flex justify-center">
          <button type="button" onClick={() => logs.fetchNextPage()} disabled={logs.isFetchingNextPage} className={ADMIN_SECONDARY_BUTTON_CLASS}>
            {logs.isFetchingNextPage ? t('loadingMore') : t('loadMore')}
          </button>
        </div>
      ) : null}
    </AdminPageFrame>
  );
}
