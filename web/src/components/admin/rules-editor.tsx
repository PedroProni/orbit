'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useUpdateSpace } from '@/hooks/use-admin';
import { useApiErrorText } from '@/hooks/use-api-error-text';
import { useToastStore } from '@/stores/toast.store';
import { ADMIN_PANEL_CLASS, ADMIN_PRIMARY_BUTTON_CLASS } from './admin.constants';
import { RulesEditorProps } from './admin.types';
import { ValueChips } from './value-chips';

export function RulesEditor({ space }: RulesEditorProps) {
  const t = useTranslations('admin');
  const errorText = useApiErrorText();
  const update = useUpdateSpace();
  const [tags, setTags] = useState(space.requiredTags);
  const [prefixes, setPrefixes] = useState(space.titlePrefixes);
  const [error, setError] = useState<string | null>(null);

  const dirty = tags.join('\n') !== space.requiredTags.join('\n') || prefixes.join('\n') !== space.titlePrefixes.join('\n');

  const save = async () => {
    setError(null);
    try {
      await update.mutateAsync({
        id: space.id,
        patch: { requiredTags: tags, titlePrefixes: prefixes },
      });
      useToastStore.getState().push('success', 'adminSaved');
    } catch (failure) {
      setError(errorText(failure));
    }
  };

  return (
    <section aria-labelledby="admin-rules-title" className={ADMIN_PANEL_CLASS}>
      <h2 id="admin-rules-title" className="border-b border-line px-3 py-2 text-sm font-semibold">
        {t('statuses.rules')}
      </h2>
      <div className="space-y-4 p-3">
        <p className="text-xs text-muted">{t('statuses.rulesHint')}</p>
        <ValueChips inputId="admin-required-tags" label={t('statuses.requiredTags')} hint={t('statuses.requiredTagsHint')} values={tags} onChange={setTags} />
        <ValueChips inputId="admin-title-prefixes" label={t('statuses.titlePrefixes')} hint={t('statuses.titlePrefixesHint')} values={prefixes} onChange={setPrefixes} />
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end">
          <button type="button" disabled={!dirty || update.isPending} onClick={() => void save()} className={ADMIN_PRIMARY_BUTTON_CLASS}>
            {t('statuses.saveRules')}
          </button>
        </div>
      </div>
    </section>
  );
}
