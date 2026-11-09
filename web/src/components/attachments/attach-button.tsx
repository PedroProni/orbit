'use client';

import { useRef } from 'react';
import { Paperclip } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function AttachButton({ onFiles, label }: { onFiles: (files: File[]) => void; label?: string }) {
  const t = useTranslations('attachments');
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={input}
        type="file"
        multiple
        hidden
        data-testid="attach-input"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = '';
          if (files.length) onFiles(files);
        }}
      />
      <button type="button" onClick={() => input.current?.click()} className="flex items-center gap-1 rounded border border-line px-2 py-1 text-xs text-muted hover:text-fg">
        <Paperclip size={12} />
        {label ?? t('attach')}
      </button>
    </>
  );
}
