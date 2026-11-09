'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DateField } from '@/components/ui/date-field';
import { Dialog } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { useApiErrorText } from '@/hooks/use-api-error-text';
import { dayFromIso, isoFromDay } from '@/lib/calendar-day';
import { ListInput } from '@/services/admin.types';
import { ADMIN_DIALOG_PANEL_CLASS, ADMIN_FIELD_CLASS, ADMIN_LABEL_CLASS, ADMIN_NAME_MAX_LENGTH, ADMIN_PRIMARY_BUTTON_CLASS, ADMIN_SECONDARY_BUTTON_CLASS, NO_FOLDER } from './admin.constants';
import { ListDialogProps } from './admin.types';
import { listDialogProblem } from './list-dialog.helpers';

function ListDialogBody({ space, list, defaultKind, defaultFolderId, onSubmit, onClose }: ListDialogProps) {
  const t = useTranslations('admin');
  const errorText = useApiErrorText();
  const [name, setName] = useState(list?.name ?? '');
  const [kind, setKind] = useState<ListInput['kind']>(list?.kind ?? defaultKind ?? 'list');
  const [folderId, setFolderId] = useState(list ? (list.folderId ?? NO_FOLDER) : (defaultFolderId ?? NO_FOLDER));
  const [start, setStart] = useState(dayFromIso(list?.startDate));
  const [end, setEnd] = useState(dayFromIso(list?.endDate));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const creating = list === null;

  const title = creating ? t(kind === 'sprint' ? 'spaces.newSprint' : 'spaces.newList') : t('spaces.editListTitle');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const input: ListInput = {
      name: name.trim(),
      kind,
      folderId: folderId || null,
      startDate: isoFromDay(start),
      endDate: isoFromDay(end),
    };
    const problem = listDialogProblem({ ...input, startDate: start || null, endDate: end || null }, creating);
    if (problem) {
      setError(t(problem === 'nameRequired' ? 'nameRequired' : `spaces.${problem}`));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit(
        creating
          ? input
          : {
              name: input.name,
              folderId: input.folderId,
              startDate: input.startDate,
              endDate: input.endDate,
            },
      );
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
          <label htmlFor="admin-list-name" className={ADMIN_LABEL_CLASS}>
            {t('nameLabel')}
          </label>
          <input id="admin-list-name" value={name} maxLength={ADMIN_NAME_MAX_LENGTH} onChange={(event) => setName(event.target.value)} className={ADMIN_FIELD_CLASS} />
        </div>
        {creating ? (
          <div>
            <span className={ADMIN_LABEL_CLASS}>{t('spaces.kindLabel')}</span>
            <Select
              ariaLabel={t('spaces.kindLabel')}
              value={kind ?? 'list'}
              onChange={(value) => setKind(value as ListInput['kind'])}
              options={(['list', 'sprint'] as const).map((value) => ({
                value,
                label: t(`spaces.kinds.${value}`),
              }))}
            />
          </div>
        ) : null}
        <div>
          <span className={ADMIN_LABEL_CLASS}>{t('spaces.folderLabel')}</span>
          <Select
            ariaLabel={t('spaces.folderLabel')}
            value={folderId}
            onChange={setFolderId}
            options={[
              { value: NO_FOLDER, label: t('spaces.noFolder') },
              ...(space?.folders ?? []).map((folder) => ({
                value: folder.id,
                label: folder.name,
              })),
            ]}
          />
        </div>
        {kind === 'sprint' ? (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className={ADMIN_LABEL_CLASS}>{t('spaces.startDate')}</span>
              <DateField ariaLabel={t('spaces.startDate')} value={start} onChange={setStart} />
            </div>
            <div>
              <span className={ADMIN_LABEL_CLASS}>{t('spaces.endDate')}</span>
              <DateField ariaLabel={t('spaces.endDate')} value={end} onChange={setEnd} />
            </div>
          </div>
        ) : null}
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
            {creating ? t('create') : t('save')}
          </button>
        </div>
      </form>
    </>
  );
}

export function ListDialog(props: ListDialogProps) {
  const t = useTranslations('admin');
  const tu = useTranslations('ui');
  return (
    <Dialog open={props.open} onClose={props.onClose} label={t(props.list ? 'spaces.editListTitle' : props.defaultKind === 'sprint' ? 'spaces.newSprint' : 'spaces.newList')} closeLabel={tu('close')} panelClassName={ADMIN_DIALOG_PANEL_CLASS}>
      <ListDialogBody {...props} />
    </Dialog>
  );
}
