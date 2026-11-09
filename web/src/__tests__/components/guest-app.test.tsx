// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, renderHook, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { makeSpace, makeTask, resetUiStore } from '../helpers/fixtures';
import { AppShell } from '@/components/shell/app-shell';
import { TaskDrawer } from '@/components/tasks/task-drawer';
import { TaskGroup } from '@/components/tasks/task-group';
import { KanbanBoard } from '@/components/tasks/kanban-board';
import { ListScreen } from '@/components/tasks/list-screen';
import { useMembers, useSearch } from '@/hooks/use-orbit';
import { useDocs } from '@/hooks/use-workspace';
import { orbitService } from '@/services/orbit.service';
import { workspaceService } from '@/services/workspace.service';
import { useSessionStore } from '@/stores/session.store';
import { authService } from '@/services/auth.service';
import { ApiError } from '@/lib/api-client';
import { useUiStore } from '@/stores/ui.store';
import { Principal, UserRole } from '@/types/api.types';

const mocks = vi.hoisted(() => ({ pathname: '/lists/l1' }));
vi.mock('next/navigation', () => ({ usePathname: () => mocks.pathname, useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }), useParams: () => ({}) }));

const principal = (role: UserRole): Principal => ({ id: 'u1', email: 'g@x.io', name: 'Pessoa', avatarUrl: null, role, status: 'active', workspaceId: 'w', scopes: [] });
const eventSources: string[] = [];

const stubServices = (role: UserRole) => {
  vi.spyOn(orbitService, 'me').mockResolvedValue(principal(role));
  vi.spyOn(orbitService, 'hierarchy').mockResolvedValue([makeSpace({ lists: [{ id: 'l1', name: 'Lista', kind: 'list', folderId: null }] } as never)]);
  vi.spyOn(orbitService, 'tasks').mockResolvedValue({ data: [makeTask()], total: 1 } as never);
  vi.spyOn(orbitService, 'task').mockResolvedValue(makeTask({ tags: ['x'] }));
  vi.spyOn(orbitService, 'taskActivity').mockResolvedValue([]);
  vi.spyOn(orbitService, 'subtasks').mockResolvedValue({ data: [], total: 0 } as never);
  return {
    members: vi.spyOn(orbitService, 'members').mockResolvedValue([]),
    notifications: vi.spyOn(orbitService, 'notifications').mockResolvedValue({ data: [], unread: 0 } as never),
    comments: vi.spyOn(orbitService, 'comments').mockResolvedValue([]),
    savedViews: vi.spyOn(orbitService, 'savedViews').mockResolvedValue([]),
    attachments: vi.spyOn(orbitService, 'attachments').mockResolvedValue([]),
    search: vi.spyOn(orbitService, 'search').mockResolvedValue({ tasks: [], comments: [] } as never),
    docs: vi.spyOn(workspaceService, 'docs').mockResolvedValue([]),
    plan: vi.spyOn(workspaceService, 'plan').mockResolvedValue({} as never),
  };
};

const settle = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)); });

describe('guest app', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetUiStore();
    eventSources.length = 0;
    mocks.pathname = '/lists/l1';
    useSessionStore.setState({ authenticated: true, hydrated: true });
    vi.stubGlobal('EventSource', class { addEventListener() {} close() {} constructor(url: string) { eventSources.push(url); } });
  });

  it('does not start the member-only requests for a guest', async () => {
    const spies = stubServices('guest');
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => ({ members: useMembers(), search: useSearch('abc'), docs: useDocs() }), { wrapper });
    await settle();
    expect(result.current.members.fetchStatus).toBe('idle');
    expect(spies.members).not.toHaveBeenCalled();
    expect(spies.search).not.toHaveBeenCalled();
    expect(spies.docs).not.toHaveBeenCalled();
  });

  it('starts them for a member', async () => {
    const spies = stubServices('member');
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    renderHook(() => ({ members: useMembers(), docs: useDocs() }), { wrapper });
    await waitFor(() => expect(spies.members).toHaveBeenCalled());
    expect(spies.docs).toHaveBeenCalled();
  });

  it('keeps the way to the own account for a guest', async () => {
    stubServices('guest');
    mocks.pathname = '/chat';
    renderWithProviders(<AppShell><p>conteudo do chat</p></AppShell>);
    const links = await screen.findAllByRole('link', { name: 'My account' });
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/account', '/account']);
  });

  it('refuses a member page by direct URL and hides the member shell', async () => {
    const spies = stubServices('guest');
    mocks.pathname = '/chat';
    renderWithProviders(<AppShell><p>conteudo do chat</p></AppShell>);
    await waitFor(() => expect(screen.getByText('You do not have access to this page')).toBeTruthy());
    expect(screen.queryByText('conteudo do chat')).toBeNull();
    expect(screen.queryByLabelText('Notifications')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Chat' })).toBeNull();
    expect(eventSources).toEqual([]);
    expect(spies.notifications).not.toHaveBeenCalled();
  });

  it('opens a shared list for a guest', async () => {
    stubServices('guest');
    renderWithProviders(<AppShell><p>lista aberta</p></AppShell>);
    await settle();
    expect(screen.getByText('lista aberta')).toBeTruthy();
    expect(eventSources).toEqual([]);
  });

  it('keeps the full shell for a member, with realtime', async () => {
    const spies = stubServices('member');
    mocks.pathname = '/chat';
    renderWithProviders(<AppShell><p>conteudo do chat</p></AppShell>);
    await waitFor(() => expect(screen.getByText('conteudo do chat')).toBeTruthy());
    expect(eventSources).toHaveLength(1);
    await waitFor(() => expect(spies.notifications).toHaveBeenCalled());
  });

  it('forgets the data of the previous user when signing out', async () => {
    stubServices('member');
    const clearCache = vi.spyOn(QueryClient.prototype, 'clear');
    renderWithProviders(<AppShell><p>conteudo</p></AppShell>);
    await settle();
    const logout = vi.spyOn(authService, 'logout').mockResolvedValue(undefined);
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    await waitFor(() => expect(clearCache).toHaveBeenCalledTimes(1));
    expect(logout).toHaveBeenCalledTimes(1);
    expect(useSessionStore.getState().authenticated).toBe(false);
  });

  it('stays signed in when the server could not end the session', async () => {
    stubServices('member');
    const clearCache = vi.spyOn(QueryClient.prototype, 'clear');
    renderWithProviders(<AppShell><p>conteudo</p></AppShell>);
    await settle();
    vi.spyOn(authService, 'logout').mockRejectedValue(new ApiError(500, 'boom'));
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    await settle();
    expect(clearCache).not.toHaveBeenCalled();
    expect(useSessionStore.getState().authenticated).toBe(true);
  });

  it('counts an expired session as signed out', async () => {
    stubServices('member');
    const clearCache = vi.spyOn(QueryClient.prototype, 'clear');
    renderWithProviders(<AppShell><p>conteudo</p></AppShell>);
    await settle();
    vi.spyOn(authService, 'logout').mockRejectedValue(new ApiError(401, 'SESSION_REQUIRED'));
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    await waitFor(() => expect(clearCache).toHaveBeenCalledTimes(1));
    expect(useSessionStore.getState().authenticated).toBe(false);
  });

  it('does not flash a member page while the session loads', async () => {
    stubServices('guest');
    vi.spyOn(orbitService, 'me').mockReturnValue(new Promise(() => {}));
    mocks.pathname = '/chat';
    renderWithProviders(<AppShell><p>conteudo do chat</p></AppShell>);
    await settle();
    expect(screen.queryByText('conteudo do chat')).toBeNull();
    expect(screen.queryByText('You do not have access to this page')).toBeNull();
  });

  it('shows a read only task to a guest and calls no member route', async () => {
    const spies = stubServices('guest');
    useUiStore.setState({ openTaskId: 't1' });
    renderWithProviders(<TaskDrawer />);
    await waitFor(() => expect((screen.getByLabelText('Task title') as HTMLTextAreaElement).readOnly).toBe(true));
    await settle();
    expect((screen.getByLabelText('Status') as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByLabelText('Priority') as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByLabelText('Due date') as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText('Read only')).toBeTruthy();
    expect(screen.queryByText('Description')).toBeNull();
    expect(screen.queryByLabelText('Assignee')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
    expect(screen.queryByLabelText('Write a comment (markdown)')).toBeNull();
    expect(spies.comments).not.toHaveBeenCalled();
    expect(spies.attachments).not.toHaveBeenCalled();
    expect(spies.plan).not.toHaveBeenCalled();
    expect(spies.members).not.toHaveBeenCalled();
  });

  it('explains a task that cannot be opened instead of loading forever', async () => {
    stubServices('member');
    vi.spyOn(orbitService, 'task').mockRejectedValue(new Error('404'));
    useUiStore.setState({ openTaskId: 'nope' });
    renderWithProviders(<TaskDrawer />);
    await waitFor(() => expect(screen.getByText('This task does not exist or you do not have access to it')).toBeTruthy());
  });

  it('hides the add buttons and the row actions in read only lists', () => {
    const space = makeSpace();
    const status = space.statuses[0];
    renderWithProviders(<TaskGroup status={status} tasks={[makeTask()]} people={[]} space={space} listId="l1" readOnly />);
    expect(screen.queryByRole('button', { name: /Add a task|Add task/ })).toBeNull();
    expect((screen.getByLabelText('Priority') as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByLabelText('Due date') as HTMLButtonElement).disabled).toBe(true);
    fireEvent.contextMenu(screen.getByText('Task one'));
    expect(screen.queryByText(/Move to/)).toBeNull();
  });

  it('hides the add button and drag handle on a read only board', () => {
    const space = makeSpace();
    stubServices('guest');
    const { container } = renderWithProviders(<KanbanBoard tasks={[makeTask()]} space={space} listId="l1" readOnly />);
    expect(screen.queryByLabelText(/^Add .* to /)).toBeNull();
    expect(container.querySelector('.cursor-grab')).toBeNull();
  });

  it('shows the list without the create form or saved views for a guest', async () => {
    const spies = stubServices('guest');
    renderWithProviders(<ListScreen listId="l1" />);
    await waitFor(() => expect(screen.getAllByText('Task one').length).toBeGreaterThan(0));
    await settle();
    expect(screen.queryByLabelText('New task title')).toBeNull();
    expect(spies.savedViews).not.toHaveBeenCalled();
    expect(spies.members).not.toHaveBeenCalled();
  });

  it('opens the task named in the link and cleans the address', async () => {
    stubServices('member');
    window.history.replaceState(null, '', '/lists/l1?task=t9');
    renderWithProviders(<ListScreen listId="l1" />);
    await waitFor(() => expect(useUiStore.getState().openTaskId).toBe('t9'));
    expect(window.location.search).toBe('');
  });
});
