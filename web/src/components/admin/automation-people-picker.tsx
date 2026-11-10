import { useTranslations } from 'next-intl';
import { ADMIN_LABEL_CLASS } from './admin.constants';
import { AutomationPeoplePickerProps } from './automation.types';

export function AutomationPeoplePicker({ legend, members, selected, onChange }: AutomationPeoplePickerProps) {
  const t = useTranslations('admin.automations');
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  return (
    <fieldset>
      <legend className={ADMIN_LABEL_CLASS}>{legend}</legend>
      {members.length === 0 ? <p className="text-sm text-muted">{t('noMembers')}</p> : null}
      <ul className="max-h-40 space-y-0.5 overflow-y-auto rounded border border-line p-1">
        {members.map((member) => (
          <li key={member.id}>
            <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-panel2">
              <input type="checkbox" checked={selected.includes(member.id)} onChange={() => toggle(member.id)} className="accent-accent" />
              <span className="min-w-0 flex-1 truncate">{member.name}</span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
