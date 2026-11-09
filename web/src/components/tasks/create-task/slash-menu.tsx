'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import { filterCommands } from './create-task.helpers';
import { SlashMenuProps } from './create-task.types';

export function SlashMenu({ query, active, onPick, onHover }: SlashMenuProps) {
  const t = useTranslations('createTask');
  const commands = filterCommands(query, (command) => t(`commands.${command.id}`));
  if (!commands.length) return <p className="px-3 py-2 text-xs text-muted">{t('noCommands')}</p>;
  return (
    <ul role="listbox" aria-label={t('commandsLabel')} className="max-h-64 overflow-y-auto p-1">
      {commands.map((command, index) => (
        <li key={command.id} role="presentation">
          <button
            type="button"
            role="option"
            aria-selected={index === active}
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={() => onHover(index)}
            onClick={() => onPick(command.id)}
            className={cn('flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm', index === active ? 'bg-panel2 text-fg' : 'text-muted')}
          >
            <command.icon size={14} className="shrink-0" />
            <span className="min-w-0 flex-1 truncate">{t(`commands.${command.id}`)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
