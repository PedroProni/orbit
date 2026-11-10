import { getTranslations } from 'next-intl/server';
import { ChangePasswordForm } from '@/components/account/change-password-form';
import { SessionsList } from '@/components/account/sessions-list';
import { PageHeader } from '@/components/ui/page-header';

export default async function AccountPage() {
  const t = await getTranslations('account');
  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-6">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      <ChangePasswordForm />
      <SessionsList />
    </div>
  );
}
