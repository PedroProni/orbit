'use client';

import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, Figma, Github, Images } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { TaskCustomFieldRows } from './task-custom-fields';
import { TaskFieldRow } from './task-field-row';
import { TaskPrintsSlot } from './task-prints-slot';
import { TaskPullRequestSlot } from './task-pull-request-slot';
import { TaskUrlSlot } from './task-url-slot';
import { TaskFieldsSectionProps } from './task-link-slots.types';

export function TaskFieldsSection({ task, readOnly, save }: TaskFieldsSectionProps) {
  const t = useTranslations('drawer');
  const [open, setOpen] = useState(true);
  return (
    <section aria-label={t('customFields')}>
      <button type="button" aria-expanded={open} onClick={() => setOpen((current) => !current)} className="mb-1 flex items-center gap-1 font-semibold">
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {t('customFields')}
      </button>
      {open ? (
        <ul className="divide-y divide-line border-y border-line">
          <TaskFieldRow icon={Github} label={t('github')}>
            <TaskPullRequestSlot taskId={task.id} readOnly={readOnly} />
          </TaskFieldRow>
          <TaskFieldRow icon={Figma} label={t('figma')}>
            <TaskUrlSlot label={t('figma')} addLabel={t('addFigma')} value={task.links.figma} readOnly={readOnly} onSave={(figma) => save({ links: { figma } })} />
          </TaskFieldRow>
          <TaskFieldRow icon={BookOpen} label={t('notion')}>
            <TaskUrlSlot label={t('notion')} addLabel={t('addNotion')} value={task.links.notion} readOnly={readOnly} onSave={(notion) => save({ links: { notion } })} />
          </TaskFieldRow>
          <TaskFieldRow icon={Images} label={t('prints')}>
            <TaskPrintsSlot taskId={task.id} readOnly={readOnly} folder={task.links.printsFolder} onSaveFolder={(printsFolder) => save({ links: { printsFolder } })} />
          </TaskFieldRow>
          {readOnly ? null : <TaskCustomFieldRows task={task} save={save} />}
        </ul>
      ) : null}
    </section>
  );
}
