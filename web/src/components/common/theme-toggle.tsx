'use client';

import { Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { applyTheme, isDarkTheme } from '@/lib/theme';

export function ThemeToggle() {
  const t = useTranslations('common');
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setDark(isDarkTheme()));
    return () => cancelAnimationFrame(frame);
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    applyTheme(next);
  };
  return (
    <button type="button" aria-label={dark ? t('themeToLight') : t('themeToDark')} aria-pressed={!dark} onClick={toggle} className="relative inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted hover:text-fg">
      <Sun size={16} className="absolute rotate-90 scale-0 opacity-0 transition-[transform,opacity] duration-(--motion-base) dark:rotate-0 dark:scale-100 dark:opacity-100 motion-reduce:transition-none" />
      <Moon size={16} className="absolute rotate-0 scale-100 opacity-100 transition-[transform,opacity] duration-(--motion-base) dark:-rotate-90 dark:scale-0 dark:opacity-0 motion-reduce:transition-none" />
    </button>
  );
}
