'use client';

import { useTranslations } from 'next-intl';
import { BOARD_NONE_KEY } from '@/components/tasks/board.constants';
import { BoardPerson } from '@/components/tasks/board.types';
import { useStatusLabel } from '@/hooks/use-status-label';
import { BoardGroupBy } from '@/types/view-display.types';

export function useBoardLabels(people: BoardPerson[]) {
  const t = useTranslations('tasks');
  const tb = useTranslations('board');
  const statusLabel = useStatusLabel();
  return (by: BoardGroupBy, key: string): string => {
    if (by === 'status') return statusLabel(key);
    if (by === 'priority') return t(`priority.${key === BOARD_NONE_KEY ? 'none' : key}`);
    if (by === 'tag') return key === BOARD_NONE_KEY ? tb('noTag') : key;
    if (key === BOARD_NONE_KEY) return tb('unassigned');
    return people.find((person) => person.id === key)?.name ?? tb('unknownPerson');
  };
}
