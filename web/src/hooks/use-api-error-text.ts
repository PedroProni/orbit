'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { describeApiError } from '@/lib/api-error';

export function useApiErrorText(): (failure: unknown) => string {
  const t = useTranslations('apiErrors');
  return useCallback(
    (failure: unknown) => {
      const described = describeApiError(failure);
      return t(described.key, described.values);
    },
    [t],
  );
}
