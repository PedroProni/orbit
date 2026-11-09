import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ListNode, SpaceNode } from '@/types/api.types';

export function ListHeader({ space, list }: { space?: SpaceNode; list?: ListNode }) {
  const t = useTranslations('tasks');
  const folder = space?.folders.find((f) => f.id === list?.folderId);
  const crumbs = [space?.name, folder?.name].filter(Boolean) as string[];
  return (
    <div className="px-4 pt-3">
      <nav aria-label={t('breadcrumbs')} className="flex min-h-5 items-center gap-1 text-xs text-muted">
        {crumbs.map((crumb) => (
          <span key={crumb} className="flex items-center gap-1">
            {crumb}
            <ChevronRight size={12} />
          </span>
        ))}
        <Link href="#" aria-current="page" className="pointer-events-none text-fg">
          {list?.name}
        </Link>
      </nav>
      <h1 className="mt-1 min-h-7 text-xl font-semibold">{list?.name}</h1>
    </div>
  );
}
