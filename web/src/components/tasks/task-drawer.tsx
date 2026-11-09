'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog } from '@/components/ui/dialog';
import { useUiStore } from '@/stores/ui.store';
import { TaskDrawerContent } from './task-drawer-content';

export function TaskDrawer() {
  const t = useTranslations('drawer');
  const openId = useUiStore((s) => s.openTaskId);
  const openTask = useUiStore((s) => s.openTask);
  const [shownId, setShownId] = useState(openId);
  if (openId && openId !== shownId) setShownId(openId);
  return (
    <Dialog open={openId !== null} onClose={() => openTask(null)} label={t('title')} closeLabel={t('close')} variant="drawer" panelClassName="h-full w-full max-w-6xl overflow-hidden border-l border-line bg-panel shadow-floating">
      {shownId ? <TaskDrawerContent key={shownId} taskId={shownId} /> : null}
    </Dialog>
  );
}
