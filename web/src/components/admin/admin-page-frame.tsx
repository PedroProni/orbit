import { PageHeader } from '@/components/ui/page-header';
import { ADMIN_PAGE_CLASS } from './admin.constants';
import { AdminPageFrameProps } from './admin.types';

export function AdminPageFrame({ title, subtitle, action, children }: AdminPageFrameProps) {
  return (
    <div className={ADMIN_PAGE_CLASS}>
      <PageHeader title={title} subtitle={subtitle} action={action} />
      {children}
    </div>
  );
}
