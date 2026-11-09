'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { APP_NAME } from '@/config/app.constants';
import { useMe } from '@/hooks/use-orbit';

export function WorkspaceSwitcher() {
  const t = useTranslations('sidebar');
  const me = useMe();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);
  return (
    <div ref={ref} className="relative mb-3">
      <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-panel2">
        <span className="flex h-6 w-6 items-center justify-center rounded bg-accent text-xs font-bold text-white">{APP_NAME.charAt(0)}</span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{APP_NAME}</span>
        <ChevronsUpDown size={14} className="text-muted" />
      </button>
      {open ? (
        <div role="menu" className="anim-pop-in absolute left-0 right-0 top-full z-40 mt-1 rounded-lg border border-line bg-panel p-1 shadow-xl">
          <p className="px-2 py-1 text-[11px] uppercase text-muted">{t('workspaces')}</p>
          <div role="menuitemradio" aria-checked="true" className="flex items-center gap-2 rounded px-2 py-1.5 text-sm">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-accent text-[10px] font-bold text-white">{APP_NAME.charAt(0)}</span>
            <span className="min-w-0 flex-1 truncate">{me.data?.name ?? APP_NAME}</span>
            <Check size={14} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
