// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { makeTask, resetUiStore } from '../helpers/fixtures';
import { InboxScreen } from '@/components/workspace/inbox-screen';
import { useUiStore } from '@/stores/ui.store';

const state = vi.hoisted(() => ({ value: {} as { isLoading?: boolean; data?: unknown } }));

vi.mock('@/hooks/use-workspace', () => ({ useInbox: () => state.value }));

describe('InboxScreen', () => {
  beforeEach(() => resetUiStore());

  it('shows the loading and error states', () => {
    state.value = { isLoading: true };
    const { unmount } = renderWithProviders(<InboxScreen />);
    expect(screen.getByText('Loading...')).toBeTruthy();
    unmount();
    state.value = { isLoading: false, data: undefined };
    renderWithProviders(<InboxScreen />);
    expect(screen.getByText('Could not load the inbox')).toBeTruthy();
  });

  it('shows empty messages for both sections', () => {
    state.value = { isLoading: false, data: { unreadNotifications: 0, assignedOpen: 0, overdue: [], dueSoon: [] } };
    renderWithProviders(<InboxScreen />);
    expect(screen.getByText('Nothing overdue')).toBeTruthy();
    expect(screen.getByText('Nothing due soon')).toBeTruthy();
    expect(screen.getByText('0 unread notifications')).toBeTruthy();
  });

  it('lists overdue and due soon tasks with links and opens the task on click', () => {
    state.value = { isLoading: false, data: { unreadNotifications: 3, assignedOpen: 7, overdue: [makeTask({ id: 'o1', listId: 'lx', title: 'Late report' })], dueSoon: [makeTask({ id: 'd1', title: 'Soon review' })] } };
    renderWithProviders(<InboxScreen />);
    expect(screen.getByText('3 unread notifications')).toBeTruthy();
    expect(screen.getByText('7 open tasks assigned to you')).toBeTruthy();
    const link = screen.getByRole('link', { name: 'Late report' });
    expect(link.getAttribute('href')).toBe('/lists/lx');
    expect(within(screen.getByText('Due soon').closest('section') as HTMLElement).getByText('Soon review')).toBeTruthy();
    fireEvent.click(link);
    expect(useUiStore.getState().openTaskId).toBe('o1');
  });
});
