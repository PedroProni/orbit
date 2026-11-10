'use client';

import { CheckCircle2, CircleDashed } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import { ADMIN_BADGE_CLASS, ADMIN_PANEL_CLASS } from './admin.constants';
import { ConfigCardProps } from './github-admin.types';

export function ConfigCard({ label, configured, hint }: ConfigCardProps) {
  const t = useTranslations('admin.integrationState');
  return (
    <div className={cn(ADMIN_PANEL_CLASS, 'flex items-start gap-3 p-3')}>
      {configured ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" /> : <CircleDashed size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium">{label}</p>
          <span className={cn(ADMIN_BADGE_CLASS, configured ? 'bg-accentsoft text-fg' : 'bg-panel2 text-muted')}>{configured ? t('configured') : t('missing')}</span>
        </div>
        <p className="mt-1 text-xs text-muted">{hint}</p>
      </div>
    </div>
  );
}
