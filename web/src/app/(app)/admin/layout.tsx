import { AdminShell } from '@/components/admin/admin-shell';
import { AdminShellProps } from '@/components/admin/admin.types';

export default function AdminLayout({ children }: AdminShellProps) {
  return <AdminShell>{children}</AdminShell>;
}
