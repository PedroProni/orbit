// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { NotificationsBell } from '@/components/shell/notifications-bell';
import { orbitService } from '@/services/orbit.service';
import { useSessionStore } from '@/stores/session.store';
import { NotificationPage } from '@/types/api.types';

const PAGE: NotificationPage = {
  unread: 2,
  data: [
    { id: 'n1', type: 'automation', taskId: 't1', actorId: 'automation', readAt: null, createdAt: '2026-11-08T10:00:00.000Z' },
    { id: 'n2', type: 'mention', taskId: 't2', actorId: 'u1', readAt: null, createdAt: '2026-11-08T09:00:00.000Z' },
  ],
};

describe('NotificationsBell', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useSessionStore.setState({ authenticated: true, hydrated: true });
    vi.spyOn(orbitService, 'notifications').mockResolvedValue(PAGE);
  });

  it('names Automation with the bot icon on a notification sent by an automation and leaves people notifications as they were', async () => {
    renderWithProviders(<NotificationsBell />);
    fireEvent.click(await screen.findByRole('button', { name: 'Notifications' }));
    const fromAutomation = (await screen.findByText('An automation notified you')).closest('button') as HTMLElement;
    const actor = fromAutomation.querySelector('[data-actor="automation"]') as HTMLElement;
    expect(actor.textContent).toBe('Automation');
    expect(actor.querySelector('svg')).toBeTruthy();
    const mention = screen.getByText('You were mentioned').closest('button') as HTMLElement;
    expect(mention.querySelector('[data-actor]')).toBeNull();
    expect(within(mention).queryByText('Automation')).toBeNull();
  });

  it('shows the automation notification in Portuguese', async () => {
    renderWithProviders(<NotificationsBell />, 'pt');
    fireEvent.click(await screen.findByRole('button', { name: 'Notificações' }));
    expect(await screen.findByText('Uma automação notificou você')).toBeTruthy();
    expect(screen.getByText('Automação')).toBeTruthy();
  });
});
