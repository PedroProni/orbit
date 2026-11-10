import { useTranslations } from 'next-intl';
import { PRIORITIES } from '@/components/tasks/tasks.constants';
import { Select } from '@/components/ui/select';
import { useStatusLabel } from '@/hooks/use-status-label';
import { cn } from '@/lib/cn';
import { AutomationActionType } from '@/services/automation.types';
import { ADMIN_FIELD_CLASS, ADMIN_LABEL_CLASS } from './admin.constants';
import { AUTOMATION_ACTIONS, AUTOMATION_COMMENT_MAX_LENGTH, AUTOMATION_NOTIFY_TARGETS, AUTOMATION_NOTIFY_USERS, AUTOMATION_WEBHOOK_MAX_LENGTH } from './automation.constants';
import { defaultActionValue } from './automation.helpers';
import { AutomationFieldsProps } from './automation.types';
import { AutomationPeoplePicker } from './automation-people-picker';

export function AutomationActionFields({ draft, statuses, members, onChange }: AutomationFieldsProps) {
  const t = useTranslations('admin.automations');
  const tp = useTranslations('tasks.priority');
  const statusLabel = useStatusLabel();
  const setValue = (actionValue: string) => onChange({ actionValue });
  const parameter = (() => {
    switch (draft.actionType) {
      case 'assign':
        return <Select ariaLabel={t('personLabel')} placeholder={t('choose')} value={draft.actionValue} onChange={setValue} options={members.map((member) => ({ value: member.id, label: member.name }))} />;
      case 'add_tag':
        return (
          <div>
            <label htmlFor="automation-tag" className={ADMIN_LABEL_CLASS}>
              {t('tagLabel')}
            </label>
            <input id="automation-tag" value={draft.actionValue} onChange={(event) => setValue(event.target.value)} className={ADMIN_FIELD_CLASS} />
          </div>
        );
      case 'set_priority':
        return <Select ariaLabel={t('priorityLabel')} placeholder={t('choose')} value={draft.actionValue} onChange={setValue} options={PRIORITIES.map((value) => ({ value, label: tp(value) }))} />;
      case 'set_status':
        return <Select ariaLabel={t('statusLabel')} placeholder={t('choose')} value={draft.actionValue} onChange={setValue} options={statuses.map((name) => ({ value: name, label: statusLabel(name) }))} />;
      case 'comment': {
        const over = draft.actionValue.trim().length > AUTOMATION_COMMENT_MAX_LENGTH;
        return (
          <div>
            <label htmlFor="automation-comment" className={ADMIN_LABEL_CLASS}>
              {t('commentLabel')}
            </label>
            <textarea id="automation-comment" rows={4} value={draft.actionValue} onChange={(event) => setValue(event.target.value)} aria-describedby="automation-comment-count" className={cn(ADMIN_FIELD_CLASS, 'resize-y')} />
            <p id="automation-comment-count" className={cn('mt-1 text-right text-xs tabular-nums', over ? 'text-danger' : 'text-muted')}>
              {t('commentCount', { count: draft.actionValue.trim().length, max: AUTOMATION_COMMENT_MAX_LENGTH })}
            </p>
          </div>
        );
      }
      case 'notify':
        return (
          <>
            <Select ariaLabel={t('notifyLabel')} value={draft.actionValue} onChange={(actionValue) => onChange({ actionValue, actionUserIds: [] })} options={AUTOMATION_NOTIFY_TARGETS.map((value) => ({ value, label: t(`notifyTargets.${value}`) }))} />
            {draft.actionValue === AUTOMATION_NOTIFY_USERS ? <AutomationPeoplePicker legend={t('notifyPeople')} members={members} selected={draft.actionUserIds} onChange={(actionUserIds) => onChange({ actionUserIds })} /> : null}
          </>
        );
      default:
        return (
          <div>
            <label htmlFor="automation-webhook" className={ADMIN_LABEL_CLASS}>
              {t('webhookLabel')}
            </label>
            <input
              id="automation-webhook"
              type="url"
              inputMode="url"
              placeholder={t('webhookPlaceholder')}
              value={draft.actionValue}
              maxLength={AUTOMATION_WEBHOOK_MAX_LENGTH}
              onChange={(event) => setValue(event.target.value)}
              aria-describedby="automation-webhook-hint"
              className={ADMIN_FIELD_CLASS}
            />
            <p id="automation-webhook-hint" className="mt-1 text-xs text-muted">
              {t('webhookHint')}
            </p>
          </div>
        );
    }
  })();
  return (
    <fieldset className="space-y-2 rounded-lg border border-line p-3">
      <legend className="px-1 text-xs font-semibold uppercase text-muted">{t('thenLegend')}</legend>
      <div>
        <span className={ADMIN_LABEL_CLASS}>{t('actionLabel')}</span>
        <Select
          ariaLabel={t('actionLabel')}
          value={draft.actionType}
          onChange={(value) => {
            const actionType = value as AutomationActionType;
            onChange({ actionType, actionValue: defaultActionValue(actionType), actionUserIds: [] });
          }}
          options={AUTOMATION_ACTIONS.map((value) => ({ value, label: t(`actions.${value}`) }))}
        />
      </div>
      {parameter}
    </fieldset>
  );
}
