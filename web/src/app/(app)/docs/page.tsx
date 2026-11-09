import dynamic from 'next/dynamic';
import { DocsSkeleton } from '@/components/workspace/screen-skeletons';

const DocsScreen = dynamic(() => import('@/components/workspace/docs-screen').then((m) => m.DocsScreen), { loading: () => <DocsSkeleton /> });

export default function Page() {
  return <DocsScreen />;
}
