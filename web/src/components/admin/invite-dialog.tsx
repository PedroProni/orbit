'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { FIELD_CLASS, LABEL_CLASS, SUBMIT_CLASS } from '@/components/auth/auth.constants';
import { buildInviteSchema } from '@/components/auth/auth.schema';
import { InviteValues } from '@/components/auth/auth.types';
import { Dialog } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { useInviteUser } from '@/hooks/use-account';
import { describeAuthError } from '@/lib/auth-error';
import { DIALOG_SECONDARY_BUTTON_CLASS, PEOPLE_DIALOG_PANEL_CLASS } from './people.constants';
import { invitableRoles } from './people.helpers';
import { InviteDialogProps } from './people.types';

export function InviteDialog({ open, actorRole, onClose, onInvited }: InviteDialogProps) {
  const t = useTranslations('people');
  const tl = useTranslations('login');
  const te = useTranslations('authErrors');
  const tu = useTranslations('ui');
  const invite = useInviteUser();
  const [role, setRole] = useState('member');
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState } = useForm<InviteValues>({ resolver: zodResolver(buildInviteSchema(tl('invalidEmail'), tl('nameRequired'))), defaultValues: { allowExternalEmail: false } });

  const close = () => {
    reset();
    setRole('member');
    setError(null);
    onClose();
  };

  const submit = handleSubmit(async (values) => {
    setError(null);
    try {
      const result = await invite.mutateAsync({ email: values.email, name: values.name, role, allowExternalEmail: values.allowExternalEmail });
      const name = values.name;
      close();
      onInvited(name, result.link);
    } catch (failure) {
      setError(te(describeAuthError(failure)));
    }
  });

  return (
    <Dialog open={open} onClose={close} label={t('inviteTitle')} closeLabel={tu('close')} panelClassName={PEOPLE_DIALOG_PANEL_CLASS}>
      <h2 className="text-sm font-semibold">{t('inviteTitle')}</h2>
      <p className="mb-4 mt-1 text-xs text-muted">{t('inviteHint')}</p>
      <form onSubmit={submit} className="space-y-3" noValidate>
        <div>
          <label htmlFor="invite-name" className={LABEL_CLASS}>
            {tl('name')}
          </label>
          <input id="invite-name" {...register('name')} className={FIELD_CLASS} />
          {formState.errors.name ? <p className="mt-1 text-xs text-danger">{formState.errors.name.message}</p> : null}
        </div>
        <div>
          <label htmlFor="invite-email" className={LABEL_CLASS}>
            {tl('email')}
          </label>
          <input id="invite-email" type="email" {...register('email')} className={FIELD_CLASS} />
          {formState.errors.email ? <p className="mt-1 text-xs text-danger">{formState.errors.email.message}</p> : null}
        </div>
        <div>
          <span className={LABEL_CLASS}>{t('role')}</span>
          <Select ariaLabel={t('role')} value={role} onChange={setRole} options={invitableRoles(actorRole).map((value) => ({ value, label: t(`roles.${value}`) }))} />
          <p className="mt-1 text-xs text-muted">{t(`roleHints.${role}`)}</p>
        </div>
        <label className="flex items-start gap-2 text-xs text-muted">
          <input type="checkbox" className="mt-0.5" {...register('allowExternalEmail')} />
          {t('allowExternal')}
        </label>
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
        <div className="flex gap-2">
          <button type="button" onClick={close} className={DIALOG_SECONDARY_BUTTON_CLASS}>
            {tu('close')}
          </button>
          <button type="submit" disabled={formState.isSubmitting} className={SUBMIT_CLASS}>
            {t('inviteSubmit')}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
