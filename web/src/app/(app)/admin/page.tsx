import { redirect } from 'next/navigation';
import { ADMIN_HOME } from '@/components/admin/admin.constants';

export default function AdminIndexPage() {
  redirect(ADMIN_HOME);
}
