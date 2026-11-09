'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { LOCALES } from '@/config/app.constants';
import { writeLocaleCookie } from '@/lib/locale-cookie';
import { cn } from '@/lib/cn';

export function LocaleSwitch() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations('common');
  const choose = (next: string) => {
    writeLocaleCookie(next);
    router.refresh();
  };
  return (
    <div className="flex gap-1" role="group" aria-label={t('language')}>
      {LOCALES.map((code) => (
        <button key={code} type="button" onClick={() => choose(code)} className={cn('rounded px-2 py-1 text-xs uppercase', code === locale ? 'bg-accentsoft text-fg' : 'text-muted hover:text-fg')}>
          {code}
        </button>
      ))}
    </div>
  );
}
