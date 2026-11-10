'use client';

import { useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { isTyping } from '@/lib/typing-target';
import { openTaskLink } from '@/components/tasks/open-task-link';
import { useToastStore } from '@/stores/toast.store';
import { ToastAction } from '@/stores/toast.types';
import { TOAST_ICONS, TOAST_STYLES } from './toaster.constants';

export function Toaster() {
  const t = useTranslations('ui');
  const tt = useTranslations('toast');
  const router = useRouter();
  const items = useToastStore((s) => s.items);
  const dismiss = useToastStore((s) => s.dismiss);

  const run = useCallback(
    (id: number, action: ToastAction) => {
      dismiss(id);
      if (action.kind === 'open') {
        openTaskLink((href) => router.push(href), action.target, action.taskId);
        return;
      }
      void navigator.clipboard?.writeText(action.target);
      useToastStore.getState().push('info', 'linkCopied');
    },
    [dismiss, router],
  );

  useEffect(() => {
    const latest = [...items].reverse().find((item) => item.actions?.length && !item.leaving);
    if (!latest) return;
    const onKey = (event: KeyboardEvent) => {
      if (isTyping(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
      const action = latest.actions?.find((item) => item.hotkey === event.key);
      if (!action) return;
      event.preventDefault();
      run(latest.id, action);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [items, run]);

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-[calc(3.5rem+env(safe-area-inset-top))] z-[60] flex flex-col gap-2 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:left-auto sm:right-4 sm:w-80 sm:max-w-[calc(100vw-2rem)] sm:px-0">
      {items.map((item) => {
        const Icon = TOAST_ICONS[item.kind];
        return (
          <div key={item.id} className={`${item.leaving ? 'anim-toast-out' : 'anim-toast-in'} pointer-events-auto flex items-start gap-2 rounded-lg border bg-panel px-3 py-2 text-sm shadow-lg ${TOAST_STYLES[item.kind]}`}>
            <Icon size={16} className="mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="block break-words">{tt(item.messageKey, item.values)}</span>
              {item.actions?.length ? (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {item.actions.map((action) => (
                    <button key={action.hotkey} type="button" onClick={() => run(item.id, action)} className="flex items-center gap-1.5 rounded border border-line px-2 py-0.5 text-xs text-fg transition-colors hover:bg-panel2">
                      {tt(action.labelKey)}
                      <kbd className="rounded bg-panel2 px-1 text-[10px] text-muted">{action.hotkey}</kbd>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <button type="button" aria-label={t('close')} onClick={() => dismiss(item.id)} className="text-muted hover:text-fg">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
