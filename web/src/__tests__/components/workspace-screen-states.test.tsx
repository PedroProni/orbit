// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { MEMBERS } from '../helpers/fixtures';
import { ChatScreen } from '@/components/workspace/chat-screen';
import { DashboardsScreen } from '@/components/workspace/dashboards-screen';
import { DocsScreen } from '@/components/workspace/docs-screen';
import { GoalsScreen } from '@/components/workspace/goals-screen';
import { workspaceService } from '@/services/workspace.service';
import { useToastStore } from '@/stores/toast.store';

const caps = vi.hoisted(() => ({ canWrite: true }));
const q = vi.hoisted(() => ({ value: {} as Record<string, Record<string, unknown>> }));

vi.mock('@/hooks/use-capabilities', () => ({ useCapabilities: () => ({ canWrite: caps.canWrite, member: true }) }));
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams() }));
vi.mock('@/hooks/use-orbit', () => ({ useMembers: () => ({ data: MEMBERS }) }));
vi.mock('@/services/workspace.service', () => ({
  workspaceService: { createDashboard: vi.fn(), deleteDashboard: vi.fn(), updateDashboard: vi.fn(), createGoal: vi.fn(), deleteGoal: vi.fn(), createChannel: vi.fn(), postMessage: vi.fn(), createDoc: vi.fn(), saveDoc: vi.fn(), archiveDoc: vi.fn() },
}));
vi.mock('@/hooks/use-workspace', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/use-workspace')>();
  const pick = (key: string, id?: string | null) => (id === null ? { data: undefined } : (q.value[key] ?? { data: undefined }));
  return {
    useInvalidating: actual.useInvalidating,
    useDashboards: () => pick('dashboards'),
    useDashboardData: (id: string | null) => pick('dashboardData', id),
    useGoals: () => pick('goals'),
    useChannels: () => pick('channels'),
    useMessages: (id: string | null) => pick('messages', id),
    useDocs: () => pick('docs'),
    useDoc: (id: string | null) => pick('doc', id),
  };
});

const DOC = { id: 'a', title: 'Handbook', bodyMd: 'hello', spaceId: null, parentId: null, updatedAt: '2026-01-01T00:00:00Z' };
const toastKeys = () => useToastStore.getState().items.map((item) => item.messageKey);
const refused = () => Promise.reject(new Error('boom'));

describe('workspace screens: loading, error, empty, failures and confirmations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    caps.canWrite = true;
    q.value = {};
    useToastStore.setState({ items: [] });
  });
  afterEach(() => cleanup());

  it('shows a skeleton while the dashboards load, then an error whose retry asks again', () => {
    q.value = { dashboards: { isLoading: true } };
    const { unmount } = renderWithProviders(<DashboardsScreen />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeTruthy();
    unmount();
    const refetch = vi.fn();
    q.value = { dashboards: { isError: true, refetch } };
    renderWithProviders(<DashboardsScreen />);
    expect(within(screen.getByRole('alert')).getByText('Could not load this page.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('shows a skeleton for the widgets while the chosen dashboard loads and an error with retry when it fails', () => {
    q.value = { dashboards: { data: [{ id: 'd1', name: 'Team', shared: false, widgets: [] }] }, dashboardData: { isLoading: true } };
    const { unmount } = renderWithProviders(<DashboardsScreen />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeTruthy();
    unmount();
    const refetch = vi.fn();
    q.value = { dashboards: { data: [{ id: 'd1', name: 'Team', shared: false, widgets: [] }] }, dashboardData: { isError: true, refetch } };
    renderWithProviders(<DashboardsScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('gives the writer and the viewer different empty dashboard hints and hides the create form from the viewer', () => {
    q.value = { dashboards: { data: [] } };
    const { unmount } = renderWithProviders(<DashboardsScreen />);
    expect(screen.getByText('No dashboards yet')).toBeTruthy();
    expect(screen.getByText('Create a dashboard to see your tasks as charts.')).toBeTruthy();
    unmount();
    caps.canWrite = false;
    renderWithProviders(<DashboardsScreen />);
    expect(screen.getByText('Nobody has created a dashboard yet.')).toBeTruthy();
    expect(screen.queryByLabelText('Dashboard name')).toBeNull();
  });

  it('keeps the dashboard name and shows a toast when creating fails', async () => {
    q.value = { dashboards: { data: [] } };
    vi.mocked(workspaceService.createDashboard).mockImplementation(refused);
    renderWithProviders(<DashboardsScreen />);
    fireEvent.change(screen.getByLabelText('Dashboard name'), { target: { value: 'Ops' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create dashboard' }));
    await waitFor(() => expect(toastKeys()).toContain('dashboardCreateFailed'));
    expect((screen.getByLabelText('Dashboard name') as HTMLInputElement).value).toBe('Ops');
  });

  it('keeps the dialog open with the error when deleting a dashboard fails', async () => {
    q.value = { dashboards: { data: [{ id: 'd1', name: 'Team', shared: false, widgets: [] }] }, dashboardData: { data: { id: 'd1', name: 'Team', widgets: [] } } };
    vi.mocked(workspaceService.deleteDashboard).mockImplementation(refused);
    renderWithProviders(<DashboardsScreen />);
    expect(screen.getByText('This dashboard has no widgets')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Delete dashboard Team'));
    const dialog = screen.getByRole('dialog', { name: 'Delete dashboard' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    expect(await within(dialog).findByRole('alert')).toBeTruthy();
    expect(screen.getByRole('dialog', { name: 'Delete dashboard' })).toBeTruthy();
  });

  it('keeps what was typed for a goal and shows a toast when creating fails, and clears it after success', async () => {
    q.value = { goals: { data: [] } };
    vi.mocked(workspaceService.createGoal).mockImplementationOnce(refused);
    renderWithProviders(<GoalsScreen />);
    fireEvent.change(screen.getByLabelText('Goal name'), { target: { value: 'Launch' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create goal' }));
    await waitFor(() => expect(toastKeys()).toContain('goalCreateFailed'));
    expect((screen.getByLabelText('Goal name') as HTMLInputElement).value).toBe('Launch');
    vi.mocked(workspaceService.createGoal).mockResolvedValueOnce({ id: 'g1', name: 'Launch', description: '', progress: 0, dueDate: null, targets: [] });
    fireEvent.click(screen.getByRole('button', { name: 'Create goal' }));
    await waitFor(() => expect((screen.getByLabelText('Goal name') as HTMLInputElement).value).toBe(''));
  });

  it('shows the goals skeleton, the error with retry and the viewer empty hint without the form', () => {
    q.value = { goals: { isLoading: true } };
    const first = renderWithProviders(<GoalsScreen />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeTruthy();
    first.unmount();
    const refetch = vi.fn();
    q.value = { goals: { isError: true, refetch } };
    const second = renderWithProviders(<GoalsScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(refetch).toHaveBeenCalledTimes(1);
    second.unmount();
    caps.canWrite = false;
    q.value = { goals: { data: [] } };
    renderWithProviders(<GoalsScreen />);
    expect(screen.getByText('Nobody has created a goal yet.')).toBeTruthy();
    expect(screen.queryByLabelText('Goal name')).toBeNull();
  });

  it('keeps the chat message and shows a toast when sending fails, then clears it once sent', async () => {
    q.value = { channels: { data: [{ id: 'c1', name: 'general', kind: 'public' }] }, messages: { data: [] } };
    vi.mocked(workspaceService.postMessage).mockImplementationOnce(refused);
    renderWithProviders(<ChatScreen />);
    fireEvent.click(screen.getByRole('button', { name: '# general' }));
    fireEvent.change(screen.getByLabelText('Write a message'), { target: { value: 'hello team' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(toastKeys()).toContain('messageSendFailed'));
    expect((screen.getByLabelText('Write a message') as HTMLInputElement).value).toBe('hello team');
    vi.mocked(workspaceService.postMessage).mockResolvedValueOnce({ id: 'm1', authorId: 'u1', bodyMd: 'hello team', createdAt: '2026-01-01T00:00:00Z' });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect((screen.getByLabelText('Write a message') as HTMLInputElement).value).toBe(''));
    expect(workspaceService.postMessage).toHaveBeenLastCalledWith('c1', 'hello team');
  });

  it('keeps the channel name and shows a toast when creating a channel fails', async () => {
    q.value = { channels: { data: [] } };
    vi.mocked(workspaceService.createChannel).mockImplementation(refused);
    renderWithProviders(<ChatScreen />);
    expect(screen.getByText('No channels yet')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Channel name'), { target: { value: 'random' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(toastKeys()).toContain('channelCreateFailed'));
    expect((screen.getByLabelText('Channel name') as HTMLInputElement).value).toBe('random');
  });

  it('shows channels and conversation as separate views on a phone with a way back', () => {
    q.value = { channels: { data: [{ id: 'c1', name: 'general', kind: 'public' }] }, messages: { data: [] } };
    renderWithProviders(<ChatScreen />);
    const channels = screen.getByRole('complementary', { name: 'Channels' });
    expect(channels.className).not.toContain('hidden');
    expect(screen.getByRole('region', { name: 'Conversation' }).className).toContain('hidden md:flex');
    fireEvent.click(screen.getByRole('button', { name: '# general' }));
    expect(channels.className).toContain('hidden md:block');
    expect(screen.getByRole('region', { name: '# general' }).className).not.toContain('hidden');
    fireEvent.click(screen.getByRole('button', { name: 'Back to channels' }));
    expect(channels.className).not.toContain('hidden');
    expect(screen.getByText('Pick or create a channel')).toBeTruthy();
  });

  it('shows the messages error with a retry and the channel load error with a retry', () => {
    const refetchMessages = vi.fn();
    q.value = { channels: { data: [{ id: 'c1', name: 'general', kind: 'public' }] }, messages: { isError: true, refetch: refetchMessages } };
    const first = renderWithProviders(<ChatScreen />);
    fireEvent.click(screen.getByRole('button', { name: '# general' }));
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(refetchMessages).toHaveBeenCalledTimes(1);
    first.unmount();
    const refetchChannels = vi.fn();
    q.value = { channels: { isError: true, refetch: refetchChannels } };
    renderWithProviders(<ChatScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(refetchChannels).toHaveBeenCalledTimes(1);
  });

  it('asks before archiving a doc and archives only after the confirmation', async () => {
    q.value = { docs: { data: [DOC] }, doc: { data: DOC } };
    vi.mocked(workspaceService.archiveDoc).mockResolvedValue(undefined as never);
    renderWithProviders(<DocsScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Handbook' }));
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));
    const dialog = screen.getByRole('dialog', { name: 'Archive doc' });
    expect(within(dialog).getByText('Archive "Handbook"? It leaves the docs list.')).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(workspaceService.archiveDoc).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Doc title')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Archive doc' })).getByRole('button', { name: 'Archive' }));
    await waitFor(() => expect(vi.mocked(workspaceService.archiveDoc).mock.calls[0]?.[0]).toBe('a'));
    await waitFor(() => expect(screen.queryByLabelText('Doc title')).toBeNull());
  });

  it('keeps the edited doc on screen and shows a toast when saving fails', async () => {
    q.value = { docs: { data: [DOC] }, doc: { data: DOC } };
    vi.mocked(workspaceService.saveDoc).mockImplementation(refused);
    renderWithProviders(<DocsScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Handbook' }));
    fireEvent.change(screen.getByLabelText('Doc content'), { target: { value: 'edited body' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(toastKeys()).toContain('docSaveFailed'));
    expect((screen.getByLabelText('Doc content') as HTMLTextAreaElement).value).toBe('edited body');
  });

  it('shows the docs empty state with the create button for a writer and a read-only hint for a viewer', () => {
    q.value = { docs: { data: [] } };
    const first = renderWithProviders(<DocsScreen />);
    expect(screen.getByText('No docs yet')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'New doc' })).toBeTruthy();
    first.unmount();
    caps.canWrite = false;
    renderWithProviders(<DocsScreen />);
    expect(screen.getByText('Nobody has written a doc yet.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'New doc' })).toBeNull();
  });

  it('shows the doc skeleton while a doc loads and the doc error with a retry', () => {
    q.value = { docs: { data: [DOC] }, doc: { isLoading: true } };
    const first = renderWithProviders(<DocsScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Handbook' }));
    expect(screen.getByRole('status', { name: 'Loading' })).toBeTruthy();
    first.unmount();
    const refetch = vi.fn();
    q.value = { docs: { data: [DOC] }, doc: { isError: true, refetch } };
    renderWithProviders(<DocsScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Handbook' }));
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('opens a doc on a phone as its own view with a way back to the list', () => {
    q.value = { docs: { data: [DOC] }, doc: { data: DOC } };
    renderWithProviders(<DocsScreen />);
    const tree = screen.getByRole('complementary', { name: 'Docs' });
    fireEvent.click(screen.getByRole('button', { name: 'Handbook' }));
    expect(tree.className).toContain('hidden md:block');
    fireEvent.click(screen.getByRole('button', { name: 'Back to docs' }));
    expect(tree.className).not.toContain('hidden');
  });
});
