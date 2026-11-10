'use client';

import { RotateCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState } from './empty-state';
import { ERROR_STATE_RETRY_CLASS } from './error-state.constants';
import { ErrorStateProps } from './error-state.types';

export function ErrorState({ title, onRetry }: ErrorStateProps) {
  const t = useTranslations('ui');
  return (
    <div role="alert">
      <EmptyState
        title={title}
        action={
          <button type="button" onClick={() => void onRetry()} className={ERROR_STATE_RETRY_CLASS}>
            <RotateCw size={14} aria-hidden="true" />
            {t('retry')}
          </button>
        }
      />
    </div>
  );
}
