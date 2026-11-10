'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Command, Eye, LogOut, Menu, PanelLeftClose, PanelLeftOpen, UserRound } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { APP_NAME } from '@/config/app.constants';
import { useMe, useRealtime } from '@/hooks/use-orbit';
import { useCapabilities } from '@/hooks/use-capabilities';
import { AccessDenied } from '@/components/common/access-denied';
import { guestCanOpen } from './guest-access.helpers';
import { useSessionStore } from '@/stores/session.store';
import { useUiStore } from '@/stores/ui.store';
import { useToastStore } from '@/stores/toast.store';
import { authService } from '@/services/auth.service';
import { ApiError } from '@/lib/api-client';
import { useShortcuts } from '@/hooks/use-shortcuts';
import { usePresence } from '@/hooks/use-presence';
import { MOTION_BASE_MS } from '@/lib/motion.constants';
import { Toaster } from '@/components/ui/toaster';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';
import { LocaleSwitch } from '@/components/common/locale-switch';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { AppShellProps } from './app-shell.types';
import { Sidebar } from './sidebar';
import { SearchBox } from './search-box';
import { NotificationsBell } from './notifications-bell';
import { TaskDrawer } from '@/components/tasks/task-drawer';
import { CreateTaskDialog } from '@/components/tasks/create-task/create-task-dialog';

const CommandPalette = dynamic(() => import('./command-palette').then((m) => m.CommandPalette));

export function AppShell({ children }: AppShellProps) {
  const t = useTranslations('shell');
  const router = useRouter();
  const { authenticated, hydrated, clear } = useSessionStore();
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleCollapsed = useUiStore((s) => s.toggleCollapsed);
  const paletteOpen = useUiStore((s) => s.paletteOpen);
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen);
  const tp = useTranslations('palette');
  const tu = useTranslations('ui');
  const me = useMe();
  const queryClient = useQueryClient();
  const palette = usePresence(paletteOpen, MOTION_BASE_MS);
  const caps = useCapabilities();
  const pathname = usePathname();
  useRealtime(caps.member);
  useShortcuts(caps.canWrite);

  useEffect(() => {
    if (hydrated && !authenticated) router.replace('/login');
  }, [hydrated, authenticated, router]);

  if (!hydrated || !authenticated) return null;

  const signOut = async () => {
    try {
      await authService.logout();
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) {
        useToastStore.getState().push('error', 'signOutFailed');
        return;
      }
    }
    clear();
    queryClient.clear();
    router.replace('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className={cn('fixed inset-y-0 left-0 z-30 w-64 shrink-0 overflow-hidden border-r border-line bg-panel transition-[transform,width] duration-200 md:static md:translate-x-0', collapsed && 'md:w-0 md:border-r-0', sidebarOpen ? 'translate-x-0' : '-translate-x-full')}>
        <Sidebar />
      </aside>
      {sidebarOpen ? <button type="button" aria-label={t('closeMenu')} className="fixed inset-0 z-20 bg-black/50 md:hidden" onClick={() => toggleSidebar(false)} /> : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-line bg-panel px-3 py-2 sm:gap-3">
          <button type="button" aria-label={t('openMenu')} className="md:hidden" onClick={() => toggleSidebar(true)}>
            <Menu size={20} />
          </button>
          <Tooltip label={collapsed ? tu('expand') : tu('collapse')} side="bottom" align="start">
            <button type="button" aria-label={collapsed ? tu('expand') : tu('collapse')} aria-pressed={collapsed} className="hidden text-muted hover:text-fg md:block" onClick={toggleCollapsed}>
              {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </Tooltip>
          <span className="hidden font-semibold md:block">{APP_NAME}</span>
          <div className="min-w-0 flex-1">{caps.isGuest ? null : <SearchBox />}</div>
          <button type="button" aria-label={tp('open')} onClick={() => setPaletteOpen(true)} className="hidden items-center gap-1 rounded border border-line px-2 py-1 text-xs text-muted hover:text-fg sm:flex">
            <Command size={12} />
            {tp('shortcut')}
          </button>
          {caps.isViewer ? (
            <span role="status" title={t('readOnlyChipHint')} className="flex shrink-0 items-center gap-1 rounded-full border border-line bg-panel2 px-2 py-0.5 text-xs text-muted">
              <Eye size={12} aria-hidden="true" />
              {t('readOnlyChip')}
            </span>
          ) : null}
          {caps.member ? <NotificationsBell /> : null}
          <ThemeToggle />
          <LocaleSwitch />
          <Link href="/account" aria-label={t('account')} className="hidden text-sm text-muted hover:text-fg sm:block">
            {me.data?.name}
          </Link>
          <Link href="/account" aria-label={t('account')} className="text-muted hover:text-fg sm:hidden">
            <UserRound size={16} />
          </Link>
          <button type="button" aria-label={t('signOut')} title={t('signOut')} className="shrink-0 text-xs text-muted hover:text-fg" onClick={() => void signOut()}>
            <LogOut size={16} className="sm:hidden" aria-hidden="true" />
            <span className="hidden sm:inline">{t('signOut')}</span>
          </button>
        </header>
        <main className="min-h-0 flex-1 overflow-auto">{guestCanOpen(pathname) || caps.member || me.isError ? children : caps.isGuest ? <AccessDenied /> : null}</main>
      </div>
      <TaskDrawer />
      {palette.mounted ? <CommandPalette open={paletteOpen} /> : null}
      <CreateTaskDialog />
      <Toaster />
    </div>
  );
}
