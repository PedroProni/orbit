import { getTranslations } from 'next-intl/server';
import { ChangePasswordForm } from '@/components/account/change-password-form';
import { SessionsList } from '@/components/account/sessions-list';

export default async function AccountPage() {
  const t = await getTranslations('account');
  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-6">
      <h1 className="text-lg font-semibold">{t('title')}</h1>
      <ChangePasswordForm />
      <SessionsList />
    </div>
  );
}
