'use client';

import { useRef } from 'react';
import { GitBranch, Link2, ListChecks, Paperclip } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { TaskActionLinksProps } from './task-field.types';

export function TaskActionLinks({ canAddSubtask, onAddSubtask, onAddDependency, onAddChecklist, onAttach }: TaskActionLinksProps) {
  const t = useTranslations('drawer');
  const file = useRef<HTMLInputElement>(null);
  const linkClass = 'flex items-center gap-2 rounded px-1.5 py-1 text-left text-muted transition-colors hover:bg-panel2 hover:text-fg';
  return (
    <div role="group" aria-label={t('actions')} className="flex flex-col items-start text-sm">
      {canAddSubtask ? (
        <button type="button" onClick={onAddSubtask} className={linkClass}>
          <GitBranch size={14} />
          {t('addSubtask')}
        </button>
      ) : null}
      <button type="button" onClick={onAddDependency} className={linkClass}>
        <Link2 size={14} />
        {t('addDependency')}
      </button>
      <button type="button" onClick={onAddChecklist} className={linkClass}>
        <ListChecks size={14} />
        {t('createChecklist')}
      </button>
      <input
        ref={file}
        type="file"
        multiple
        hidden
        data-testid="action-attach-input"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = '';
          if (files.length) onAttach(files);
        }}
      />
      <button type="button" onClick={() => file.current?.click()} className={linkClass}>
        <Paperclip size={14} />
        {t('attachFile')}
      </button>
    </div>
  );
}
