'use client';

import { useTranslations } from 'next-intl';
import { hasAllowedPrefix, hasRequiredTag, withTitlePrefix } from './task-composer.helpers';
import { ComposerRuleHintsProps } from './composer-rule-hints.types';

export function ComposerRuleHints({ space, draft, onChange, onFocus }: ComposerRuleHintsProps) {
  const tc = useTranslations('composer');
  const missingPrefix = space.titlePrefixes.length > 0 && !hasAllowedPrefix(draft.title, space.titlePrefixes);
  const missingTag = !hasRequiredTag(draft.tags, space.requiredTags);
  if (!missingPrefix && !missingTag) return null;
  return (
    <>
      {missingPrefix ? (
        <div className="flex flex-wrap items-center gap-1" aria-label={tc('prefixes')}>
          {space.titlePrefixes.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                onChange({ title: withTitlePrefix(draft.title, value) });
                onFocus();
              }}
              className="rounded border border-line px-1.5 py-0.5 text-[11px] text-muted transition-colors hover:border-accent hover:text-fg"
            >
              [{value}]
            </button>
          ))}
        </div>
      ) : null}
      {missingTag ? (
        <div className="flex flex-wrap items-center gap-1" aria-label={tc('requiredTags')}>
          {space.requiredTags.map((tag) => (
            <button key={tag} type="button" onClick={() => onChange({ tags: [...draft.tags, tag.toLowerCase()] })} className="rounded border border-dashed border-line px-1.5 py-0.5 text-[11px] text-muted transition-colors hover:border-accent hover:text-fg">
              {tag}
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
}
