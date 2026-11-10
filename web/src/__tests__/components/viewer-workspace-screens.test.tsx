// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { MEMBERS } from '../helpers/fixtures';
import { ChatScreen } from '@/components/workspace/chat-screen';
import { DashboardsScreen } from '@/components/workspace/dashboards-screen';
import { DocsScreen } from '@/components/workspace/docs-screen';
import { GoalsScreen } from '@/components/workspace/goals-screen';

const caps = vi.hoisted(() => ({ canWrite: false }));

vi.mock('@/hooks/use-capabilities', () => ({ useCapabilities: () => ({ canWrite: caps.canWrite, isViewer: !caps.canWrite }) }));
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams() }));
vi.mock('@/hooks/use-orbit', () => ({ useMembers: () => ({ data: MEMBERS }) }));
vi.mock('@/services/workspace.service', () => ({ workspaceService: {} }));

vi.mock('@/hooks/use-workspace', () => ({
  useDocs: () => ({ data: [{ id: 'a', title: 'Handbook', spaceId: null, parentId: null, updatedAt: '2026-01-01T00:00:00Z' }] }),
  useDoc: (id: string | null) => ({ data: id ? { id, title: 'Handbook', bodyMd: 'Read **this** first', spaceId: null, parentId: null, updatedAt: '2026-01-01T00:00:00Z' } : undefined }),
  useChannels: () => ({ data: [{ id: 'c1', name: 'general', kind: 'public' }] }),
  useMessages: (id: string | null) => ({ data: id ? [{ id: 'm1', channelId: 'c1', authorId: MEMBERS[0].id, bodyMd: 'Deploy at five', createdAt: '2026-01-01T00:00:00Z' }] : undefined }),
  useGoals: () => ({ data: [{ id: 'g1', name: 'Ship v2', description: '', progress: 40, targets: [] }] }),
  useDashboards: () => ({ data: [{ id: 'd1', name: 'Team', shared: false, widgets: [] }] }),
  useDashboardData: (id: string | null) => ({ data: id ? { id: 'd1', name: 'Team', widgets: [{ id: 'w1', type: 'tasks_by_assignee', title: 'Tasks by assignee', listId: null, result: { [MEMBERS[0].id]: 4 } }] } : undefined }),
  useInvalidating: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe('workspace screens for a viewer', () => {
  beforeEach(() => {
    caps.canWrite = false;
  });

  it('reads a doc without any way to create, edit, save or archive it', () => {
    renderWithProviders(<DocsScreen />);
    expect(screen.getByText('Pick a doc')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'New doc' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Add subpage' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Handbook' }));
    expect(screen.getByRole('heading', { name: 'Handbook' })).toBeTruthy();
    expect(screen.getByText('this').tagName).toBe('STRONG');
    expect(screen.queryByLabelText('Doc title')).toBeNull();
    expect(screen.queryByLabelText('Doc content')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Archive' })).toBeNull();
  });

  it('reads a channel with the author names and gets a notice instead of the message box', () => {
    renderWithProviders(<ChatScreen />);
    expect(screen.getByText('Pick a channel')).toBeTruthy();
    expect(screen.queryByLabelText('Channel name')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '# general' }));
    expect(screen.getByText(MEMBERS[0].name)).toBeTruthy();
    expect(screen.getByText('Deploy at five')).toBeTruthy();
    expect(screen.getByRole('note').textContent).toBe('You can read this channel. Your role cannot send messages.');
    expect(screen.queryByLabelText('Write a message')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Send' })).toBeNull();
  });

  it('sees goal progress with no create form and no delete', () => {
    renderWithProviders(<GoalsScreen />);
    expect(screen.getByRole('progressbar', { name: 'Ship v2' }).getAttribute('aria-valuenow')).toBe('40');
    expect(screen.queryByLabelText('Goal name')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Create goal' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
  });

  it('sees dashboard widgets with member names and no create, delete or widget controls', () => {
    renderWithProviders(<DashboardsScreen />);
    expect(screen.getByRole('region', { name: 'Tasks by assignee' })).toBeTruthy();
    expect(screen.getAllByText(MEMBERS[0].name).length).toBeGreaterThan(0);
    expect(screen.queryByLabelText('Dashboard name')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Delete dashboard' })).toBeNull();
    expect(screen.queryByRole('combobox', { name: 'Add widget' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Remove widget' })).toBeNull();
  });

  it('keeps every control for someone who can write', () => {
    caps.canWrite = true;
    const { unmount } = renderWithProviders(<DocsScreen />);
    expect(screen.getByRole('button', { name: 'New doc' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Handbook' }));
    expect(screen.getByLabelText('Doc title')).toBeTruthy();
    unmount();
    renderWithProviders(<ChatScreen />);
    fireEvent.click(screen.getByRole('button', { name: '# general' }));
    expect(screen.getByLabelText('Write a message')).toBeTruthy();
    expect(screen.queryByRole('note')).toBeNull();
  });
});
