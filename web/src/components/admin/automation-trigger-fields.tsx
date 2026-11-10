import { useTranslations } from 'next-intl';
import { PRIORITIES } from '@/components/tasks/tasks.constants';
import { Select } from '@/components/ui/select';
import { useStatusLabel } from '@/hooks/use-status-label';
import { AutomationTriggerType } from '@/services/automation.types';
import { ADMIN_LABEL_CLASS } from './admin.constants';
import { AUTOMATION_ANY_VALUE, AUTOMATION_DATE_FIELDS, AUTOMATION_TRIGGERS } from './automation.constants';
import { AutomationFieldsProps } from './automation.types';

export function AutomationTriggerFields({ draft, statuses, members, onChange }: AutomationFieldsProps) {
  const t = useTranslations('admin.automations');
  const tp = useTranslations('tasks.priority');
  const statusLabel = useStatusLabel();
  const parameter = (() => {
    switch (draft.triggerType) {
      case 'status_changed':
        return <Select ariaLabel={t('statusLabel')} placeholder={t('choose')} value={draft.triggerValue} onChange={(triggerValue) => onChange({ triggerValue })} options={statuses.map((name) => ({ value: name, label: statusLabel(name) }))} />;
      case 'priority_changed':
        return (
          <Select
            ariaLabel={t('priorityLabel')}
            value={draft.triggerValue}
            onChange={(triggerValue) => onChange({ triggerValue })}
            options={[{ value: AUTOMATION_ANY_VALUE, label: t('anyPriority') }, ...PRIORITIES.map((value) => ({ value, label: tp(value) }))]}
          />
        );
      case 'assignee_added':
        return (
          <Select
            ariaLabel={t('personLabel')}
            value={draft.triggerValue}
            onChange={(triggerValue) => onChange({ triggerValue })}
            options={[{ value: AUTOMATION_ANY_VALUE, label: t('anyone') }, ...members.map((member) => ({ value: member.id, label: member.name }))]}
          />
        );
      case 'date_reached':
        return (
          <Select ariaLabel={t('dateLabel')} placeholder={t('choose')} value={draft.triggerValue} onChange={(triggerValue) => onChange({ triggerValue })} options={AUTOMATION_DATE_FIELDS.map((value) => ({ value, label: t(`dates.${value}`) }))} />
        );
      default:
        return null;
    }
  })();
  return (
    <fieldset className="space-y-2 rounded-lg border border-line p-3">
      <legend className="px-1 text-xs font-semibold uppercase text-muted">{t('whenLegend')}</legend>
      <div>
        <span className={ADMIN_LABEL_CLASS}>{t('triggerLabel')}</span>
        <Select
          ariaLabel={t('triggerLabel')}
          value={draft.triggerType}
          onChange={(value) => onChange({ triggerType: value as AutomationTriggerType, triggerValue: AUTOMATION_ANY_VALUE })}
          options={AUTOMATION_TRIGGERS.map((value) => ({ value, label: t(`triggers.${value}`) }))}
        />
      </div>
      {parameter}
    </fieldset>
  );
}
