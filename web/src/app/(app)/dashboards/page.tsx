import dynamic from 'next/dynamic';
import { DashboardsSkeleton } from '@/components/workspace/screen-skeletons';

const DashboardsScreen = dynamic(() => import('@/components/workspace/dashboards-screen').then((m) => m.DashboardsScreen), { loading: () => <DashboardsSkeleton /> });

export default function Page() {
  return <DashboardsScreen />;
}
