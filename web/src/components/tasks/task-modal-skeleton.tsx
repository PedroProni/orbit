import { Skeleton } from '@/components/ui/skeleton';

export function TaskModalSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <Skeleton height={14} width={160} />
        <Skeleton height={28} width="70%" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} height={52} />
          ))}
        </div>
        <Skeleton height={140} />
      </div>
      <div className="space-y-3">
        <Skeleton height={20} width={120} />
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} height={44} />
        ))}
      </div>
    </div>
  );
}
