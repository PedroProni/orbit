'use client';

import { KeyboardEvent, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Avatar } from '@/components/common/avatar';
import { useMembers } from '@/hooks/use-orbit';
import { moveIndex } from '@/components/shell/command-palette.helpers';
import { activeMentionQuery, insertMention, suggestMembers } from './mentions.helpers';
import { MentionTextareaProps } from './mention-textarea.types';
import { Member } from '@/types/api.types';

export function MentionTextarea({ value, onChange, label, placeholder, rows = 3 }: MentionTextareaProps) {
  const t = useTranslations('drawer');
  const members = useMembers();
  const listId = useId();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [caret, setCaret] = useState(0);
  const [active, setActive] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const mention = dismissed ? null : activeMentionQuery(value, caret);
  const suggestions = mention ? suggestMembers(members.data ?? [], mention.query) : [];
  const open = suggestions.length > 0;
  const current = suggestions[Math.min(active, suggestions.length - 1)];

  const choose = (member: Member) => {
    if (!mention) return;
    const next = insertMention(value, mention, caret, member.name);
    onChange(next.text);
    setCaret(next.caret);
    setActive(0);
    requestAnimationFrame(() => {
      ref.current?.focus();
      ref.current?.setSelectionRange(next.caret, next.caret);
    });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!open) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => moveIndex(i, e.key === 'ArrowDown' ? 1 : -1, suggestions.length));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      choose(current);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setDismissed(true);
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={ref}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        rows={rows}
        onChange={(e) => {
          onChange(e.target.value);
          setCaret(e.target.selectionStart);
          setActive(0);
          setDismissed(false);
        }}
        onSelect={(e) => setCaret(e.currentTarget.selectionStart)}
        onKeyDown={onKeyDown}
        className="w-full rounded border border-line bg-panel2 p-2 text-sm"
      />
      {open ? (
        <ul id={listId} role="listbox" aria-label={t('mentionList')} className="absolute bottom-full left-0 z-20 mb-1 max-h-56 w-64 overflow-auto rounded border border-line bg-panel p-1 shadow-lg">
          {suggestions.map((member) => (
            <li key={member.id} role="option" aria-selected={member.id === current.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(member)}
                className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm ${member.id === current.id ? 'bg-accentsoft' : ''}`}
              >
                <Avatar id={member.id} name={member.name} size={20} />
                <span className="min-w-0 flex-1 truncate">{member.name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
