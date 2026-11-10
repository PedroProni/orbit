import { PageHeaderProps } from './page-header.types';

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-2xl text-xs text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
