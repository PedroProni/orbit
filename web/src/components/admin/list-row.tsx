'use client';

import Link from 'next/link';
import { List, MoreHorizontal, Zap } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { formatShortDay } from '@/lib/calendar-day';
import { ADMIN_ICON_BUTTON_CLASS } from './admin.constants';
import { ListRowProps } from './admin.types';

export function ListRow({ space, list, actions }: ListRowProps) {
  const t = useTranslations('admin.spaces');
  const locale = useLocale();
  const Icon = list.kind === 'sprint' ? Zap : List;
  const dates =
    list.startDate && list.endDate
      ? t('sprintDates', {
          start: formatShortDay(list.startDate, locale),
          end: formatShortDay(list.endDate, locale),
        })
      : null;
  return (
    <li className="flex items-center gap-2 py-1.5 pl-2 pr-1">
      <Icon size={14} className="shrink-0 text-muted" />
      <Link href={`/lists/${list.id}`} className="min-w-0 flex-1 truncate text-sm hover:underline">
        {list.name}
      </Link>
      {dates ? <span className="hidden shrink-0 text-xs text-muted sm:inline">{dates}</span> : null}
      <DropdownMenu
        label={t('actionsFor', { name: list.name })}
        className={ADMIN_ICON_BUTTON_CLASS}
        items={[
          {
            key: 'edit',
            label: t('edit'),
            onSelect: () => actions.editList(space, list),
          },
          {
            key: 'delete',
            label: t('deleteListTitle'),
            danger: true,
            onSelect: () => actions.remove({ kind: 'list', space, list }),
          },
        ]}
      >
        <MoreHorizontal size={14} />
      </DropdownMenu>
    </li>
  );
}
