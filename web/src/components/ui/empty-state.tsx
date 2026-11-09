import { EmptyStateProps } from './empty-state.types';

export function EmptyState({ title, hint, action }: EmptyStateProps) {
  return (
    <div className="anim-fade-in mx-auto flex max-w-sm flex-col items-center gap-3 px-4 py-12 text-center">
      <svg width="96" height="96" viewBox="0 0 96 96" fill="none" aria-hidden="true">
        <circle cx="48" cy="48" r="30" stroke="var(--border)" strokeWidth="2" strokeDasharray="4 6" />
        <circle cx="48" cy="48" r="16" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="2" />
        <circle cx="78" cy="48" r="5" fill="var(--accent)" />
        <circle cx="22" cy="30" r="3" fill="var(--muted)" />
      </svg>
      <p className="font-medium">{title}</p>
      {hint ? <p className="text-sm text-muted">{hint}</p> : null}
      {action}
    </div>
  );
}
