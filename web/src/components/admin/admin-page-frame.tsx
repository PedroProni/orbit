import { ADMIN_PAGE_CLASS } from './admin.constants';
import { AdminPageFrameProps } from './admin.types';

export function AdminPageFrame({ title, subtitle, action, children }: AdminPageFrameProps) {
  return (
    <div className={ADMIN_PAGE_CLASS}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold">{title}</h1>
          <p className="mt-1 max-w-2xl text-xs text-muted">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
