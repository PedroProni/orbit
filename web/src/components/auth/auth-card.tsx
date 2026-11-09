import { APP_NAME } from '@/config/app.constants';
import { LocaleSwitch } from '@/components/common/locale-switch';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { AuthCardProps } from './auth.types';

export function AuthCard({ subtitle, children }: AuthCardProps) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl border border-line bg-panel p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold">{APP_NAME}</h1>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <LocaleSwitch />
          </div>
        </div>
        {subtitle ? <p className="mb-4 text-sm text-muted">{subtitle}</p> : null}
        {children}
      </div>
    </main>
  );
}
