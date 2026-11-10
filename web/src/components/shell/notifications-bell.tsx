'use client';

import { useState } from 'react';
import { Bell, Bot } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AUTOMATION_ACTOR_ID } from '@/components/tasks/tasks.constants';
import { useMarkRead, useNotifications } from '@/hooks/use-orbit';
import { useUiStore } from '@/stores/ui.store';

export function NotificationsBell() {
  const t = useTranslations('notifications');
  const ta = useTranslations('activity');
  const [open, setOpen] = useState(false);
  const notifications = useNotifications();
  const markRead = useMarkRead();
  const openTask = useUiStore((s) => s.openTask);
  const unread = notifications.data?.unread ?? 0;
  return (
    <div className="relative">
      <button type="button" aria-label={t('label')} onClick={() => setOpen((v) => !v)} className="relative p-1">
        <Bell size={18} />
        {unread > 0 ? <span className="absolute -right-1 -top-1 rounded-full bg-accent px-1 text-[10px] text-white">{unread}</span> : null}
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-40 mt-2 w-72 rounded border border-line bg-panel shadow-lg">
          <div className="flex items-center justify-between border-b border-line px-3 py-2 text-sm">
            <span>{t('title')}</span>
            <button type="button" className="text-xs text-muted hover:text-fg" onClick={() => markRead.mutate(undefined)}>
              {t('markAll')}
            </button>
          </div>
          <ul className="max-h-80 overflow-auto">
            {notifications.data?.data.length === 0 ? <li className="px-3 py-3 text-sm text-muted">{t('empty')}</li> : null}
            {notifications.data?.data.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-panel2"
                  onClick={() => {
                    markRead.mutate([n.id]);
                    if (n.taskId) openTask(n.taskId);
                    setOpen(false);
                  }}
                >
                  {n.actorId === AUTOMATION_ACTOR_ID ? (
                    <span data-actor={AUTOMATION_ACTOR_ID} className="mb-0.5 flex items-center gap-1 text-xs font-medium text-accent">
                      <Bot size={12} aria-hidden="true" />
                      {ta('automation')}
                    </span>
                  ) : null}
                  <span className={n.readAt ? 'text-muted' : 'text-fg'}>{t(`type.${n.type}`)}</span>
                  <span className="ml-2 text-xs text-muted">{n.taskId}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
