'use client';

import { Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ADMIN_PANEL_CLASS, TASK_KINDS } from './admin.constants';
import { AdminPageFrame } from './admin-page-frame';

export function TaskTypesAdminPage() {
  const t = useTranslations('admin');
  const tp = useTranslations('planning.kinds');
  return (
    <AdminPageFrame title={t('sections.taskTypes')} subtitle={t('taskTypes.subtitle')}>
      <section aria-label={t('sections.taskTypes')} className={ADMIN_PANEL_CLASS}>
        <p className="flex items-center gap-1.5 border-b border-line px-3 py-2 text-xs text-muted">
          <Lock size={12} />
          {t('taskTypes.fixed')}
        </p>
        <ul className="divide-y divide-line">
          {TASK_KINDS.map((kind) => (
            <li key={kind} className="px-3 py-2">
              <p className="text-sm font-medium">{tp(kind)}</p>
              <p className="text-xs text-muted">{t(`taskTypes.descriptions.${kind}`)}</p>
            </li>
          ))}
        </ul>
      </section>
    </AdminPageFrame>
  );
}
