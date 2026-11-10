'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { useApiErrorText } from '@/hooks/use-api-error-text';
import { TaskKind, TaskPriority } from '@/types/api.types';
import { ADMIN_FIELD_CLASS, ADMIN_LABEL_CLASS, ADMIN_PRIMARY_BUTTON_CLASS, ADMIN_SECONDARY_BUTTON_CLASS, ADMIN_WIDE_DIALOG_PANEL_CLASS, TASK_KINDS } from './admin.constants';
import { TEMPLATE_DESCRIPTION_MAX_LENGTH, TEMPLATE_NAME_MAX_LENGTH, TEMPLATE_NO_PRIORITY, TEMPLATE_PRIORITIES, TEMPLATE_TITLE_MAX_LENGTH } from './templates.constants';
import { draftFromTemplate, draftToTemplateInput, emptyTemplateDraft, templateProblem } from './templates.helpers';
import { TemplateDialogProps, TemplateDraft } from './templates.types';

function TemplateDialogBody({ template, spaces, onSubmit, onClose }: TemplateDialogProps) {
  const t = useTranslations('admin');
  const tt = useTranslations('admin.templates');
  const tp = useTranslations('tasks.priority');
  const tk = useTranslations('planning.kinds');
  const errorText = useApiErrorText();
  const [draft, setDraft] = useState<TemplateDraft>(() => (template ? draftFromTemplate(template) : emptyTemplateDraft(spaces[0]?.id ?? '')));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const change = (patch: Partial<TemplateDraft>) => setDraft((current) => ({ ...current, ...patch }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const problem = templateProblem(draft);
    if (problem) {
      setError(tt(`problems.${problem}`));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit(draftToTemplateInput(draft));
      onClose();
    } catch (failure) {
      setError(errorText(failure));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="flex min-h-0 flex-1 flex-col" noValidate>
      <h2 className="border-b border-line px-5 py-4 text-sm font-semibold">{template ? tt('editTitle') : tt('createTitle')}</h2>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
        <div>
          <span className={ADMIN_LABEL_CLASS}>{tt('spaceLabel')}</span>
          <Select ariaLabel={tt('spaceLabel')} value={draft.spaceId} onChange={(spaceId) => change({ spaceId })} options={spaces.map((space) => ({ value: space.id, label: space.name }))} />
        </div>
        <div>
          <label htmlFor="template-name" className={ADMIN_LABEL_CLASS}>
            {t('nameLabel')}
          </label>
          <input id="template-name" value={draft.name} maxLength={TEMPLATE_NAME_MAX_LENGTH} onChange={(event) => change({ name: event.target.value })} className={ADMIN_FIELD_CLASS} />
        </div>
        <div>
          <label htmlFor="template-title" className={ADMIN_LABEL_CLASS}>
            {tt('titleLabel')}
          </label>
          <input id="template-title" value={draft.titleTemplate} maxLength={TEMPLATE_TITLE_MAX_LENGTH} onChange={(event) => change({ titleTemplate: event.target.value })} className={ADMIN_FIELD_CLASS} />
        </div>
        <div>
          <label htmlFor="template-description" className={ADMIN_LABEL_CLASS}>
            {tt('descriptionLabel')}
          </label>
          <textarea id="template-description" rows={5} value={draft.descriptionMd} maxLength={TEMPLATE_DESCRIPTION_MAX_LENGTH} onChange={(event) => change({ descriptionMd: event.target.value })} className={ADMIN_FIELD_CLASS} />
        </div>
        <div>
          <label htmlFor="template-tags" className={ADMIN_LABEL_CLASS}>
            {tt('tagsLabel')}
          </label>
          <input id="template-tags" value={draft.tags} placeholder={tt('tagsPlaceholder')} onChange={(event) => change({ tags: event.target.value })} className={ADMIN_FIELD_CLASS} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <span className={ADMIN_LABEL_CLASS}>{tt('priorityLabel')}</span>
            <Select
              ariaLabel={tt('priorityLabel')}
              value={draft.priority}
              onChange={(priority) => change({ priority: priority as TaskPriority | '' })}
              options={[{ value: TEMPLATE_NO_PRIORITY, label: tp('none') }, ...TEMPLATE_PRIORITIES.map((priority) => ({ value: priority, label: tp(priority) }))]}
            />
          </div>
          <div>
            <span className={ADMIN_LABEL_CLASS}>{tt('kindLabel')}</span>
            <Select ariaLabel={tt('kindLabel')} value={draft.taskKind} onChange={(taskKind) => change({ taskKind: taskKind as TaskKind })} options={TASK_KINDS.map((kind) => ({ value: kind, label: tk(kind) }))} />
          </div>
          <div>
            <label htmlFor="template-estimate" className={ADMIN_LABEL_CLASS}>
              {tt('estimateLabel')}
            </label>
            <input id="template-estimate" inputMode="numeric" value={draft.estimate} onChange={(event) => change({ estimate: event.target.value })} className={ADMIN_FIELD_CLASS} />
          </div>
        </div>
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
      </div>
      <div className="flex justify-end gap-2 border-t border-line px-5 py-3">
        <button type="button" onClick={onClose} className={ADMIN_SECONDARY_BUTTON_CLASS}>
          {t('cancel')}
        </button>
        <button type="submit" disabled={busy} className={ADMIN_PRIMARY_BUTTON_CLASS}>
          {template ? t('save') : t('create')}
        </button>
      </div>
    </form>
  );
}

export function TemplateDialog(props: TemplateDialogProps) {
  const tt = useTranslations('admin.templates');
  const tu = useTranslations('ui');
  return (
    <Dialog open={props.open} onClose={props.onClose} label={props.template ? tt('editTitle') : tt('createTitle')} closeLabel={tu('close')} panelClassName={ADMIN_WIDE_DIALOG_PANEL_CLASS}>
      <TemplateDialogBody key={props.template?.id ?? 'new'} {...props} />
    </Dialog>
  );
}
