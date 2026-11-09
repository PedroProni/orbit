'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog } from '@/components/ui/dialog';
import { useApiErrorText } from '@/hooks/use-api-error-text';
import { ADMIN_DIALOG_PANEL_CLASS, ADMIN_FIELD_CLASS, ADMIN_LABEL_CLASS, ADMIN_PRIMARY_BUTTON_CLASS, ADMIN_SECONDARY_BUTTON_CLASS, GROUP_NAME_MAX_LENGTH } from './admin.constants';
import { GroupDialogProps } from './admin.types';

function GroupDialogBody({ group, members, onSubmit, onClose }: GroupDialogProps) {
  const t = useTranslations('admin');
  const errorText = useApiErrorText();
  const [name, setName] = useState(group?.name ?? '');
  const [memberIds, setMemberIds] = useState<string[]>(group?.memberIds ?? []);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const title = group ? t('groupsPage.editTitle') : t('groupsPage.createTitle');

  const toggle = (id: string) => setMemberIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError(t('nameRequired'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ name: name.trim(), memberIds });
      onClose();
    } catch (failure) {
      setError(errorText(failure));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h2 className="mb-4 text-sm font-semibold">{title}</h2>
      <form onSubmit={(event) => void submit(event)} className="space-y-3" noValidate>
        <div>
          <label htmlFor="admin-group-name" className={ADMIN_LABEL_CLASS}>
            {t('nameLabel')}
          </label>
          <input id="admin-group-name" value={name} maxLength={GROUP_NAME_MAX_LENGTH} onChange={(event) => setName(event.target.value)} className={ADMIN_FIELD_CLASS} />
        </div>
        <fieldset>
          <legend className={ADMIN_LABEL_CLASS}>{t('groupsPage.members')}</legend>
          <p className="mb-2 text-xs text-muted">{t('groupsPage.membersHint')}</p>
          {members.length === 0 ? <p className="text-sm text-muted">{t('groupsPage.noMembers')}</p> : null}
          <ul className="max-h-56 space-y-0.5 overflow-y-auto rounded border border-line p-1">
            {members.map((member) => (
              <li key={member.id}>
                <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-panel2">
                  <input type="checkbox" checked={memberIds.includes(member.id)} onChange={() => toggle(member.id)} className="accent-accent" />
                  <span className="min-w-0 flex-1 truncate">{member.name}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={ADMIN_SECONDARY_BUTTON_CLASS}>
            {t('cancel')}
          </button>
          <button type="submit" disabled={busy} className={ADMIN_PRIMARY_BUTTON_CLASS}>
            {group ? t('save') : t('create')}
          </button>
        </div>
      </form>
    </>
  );
}

export function GroupDialog(props: GroupDialogProps) {
  const t = useTranslations('admin');
  const tu = useTranslations('ui');
  return (
    <Dialog open={props.open} onClose={props.onClose} label={t(props.group ? 'groupsPage.editTitle' : 'groupsPage.createTitle')} closeLabel={tu('close')} panelClassName={ADMIN_DIALOG_PANEL_CLASS}>
      <GroupDialogBody {...props} />
    </Dialog>
  );
}
