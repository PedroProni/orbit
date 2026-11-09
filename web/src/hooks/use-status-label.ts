'use client';

import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { SYSTEM_STATUS_KEYS } from '@/config/system-status.constants';

export function useStatusLabel(): (name: string) => string {
  const t = useTranslations('statusNames');
  return useCallback(
    (name: string) => {
      const key = SYSTEM_STATUS_KEYS[name.trim().toLowerCase()];
      return key ? t(key) : name;
    },
    [t],
  );
}
