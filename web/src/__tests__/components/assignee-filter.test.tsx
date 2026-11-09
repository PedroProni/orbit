// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { MEMBERS, resetUiStore } from '../helpers/fixtures';
import { AssigneeFilter } from '@/components/tasks/assignee-filter';
import { orbitService } from '@/services/orbit.service';
import { EMPTY_FILTERS } from '@/stores/ui.constants';
import { useSessionStore } from '@/stores/session.store';
import { useUiStore } from '@/stores/ui.store';
import { Member } from '@/types/api.types';

const PEOPLE: Member[] = [
  ...MEMBERS,
  { id: 'u3', email: 'carla@empresa.io', name: 'Carla Dias', avatarUrl: null, role: 'admin', status: 'active' },
  { id: 'u4', email: 'gui@x.io', name: 'Guest Person', avatarUrl: null, role: 'guest', status: 'active' },
  { id: 'u5', email: 'old@x.io', name: 'Old Person', avatarUrl: null, role: 'member', status: 'disabled' },
];
const meAs = (index: number, role = PEOPLE[index].role) => vi.spyOn(orbitService, 'me').mockResolvedValue({ ...PEOPLE[index], role, workspaceId: 'w', scopes: [] } as never);
const openPanel = () => fireEvent.click(screen.getByRole('button', { name: /^Assignees/ }));
const panel = () => screen.getByRole('dialog', { name: 'Assignees' });
const rowNames = () =>
  within(panel())
    .getAllByRole('checkbox')
    .map((box) => box.getAttribute('aria-label'));

describe('AssigneeFilter', () => {
  beforeEach(() => {
    useSessionStore.setState({ authenticated: true, hydrated: true });
    vi.restoreAllMocks();
    resetUiStore();
    vi.spyOn(orbitService, 'members').mockResolvedValue(PEOPLE);
    vi.spyOn(orbitService, 'assigneeCounts').mockResolvedValue({
      total: 6,
      unassigned: 2,
      byAssignee: [
        { assigneeId: 'u3', count: 3 },
        { assigneeId: 'u1', count: 1 },
      ],
    });
    meAs(1);
  });

  it('lists unassigned first, then me marked as me, then the others by count, with the counts of the current filters', async () => {
    useUiStore.setState({ filters: { ...EMPTY_FILTERS, statuses: ['doing'], q: 'login', assigneeIds: ['u3'] } });
    renderWithProviders(<AssigneeFilter listId="l1" />);
    await screen.findByRole('button', { name: 'Me' });
    openPanel();
    await waitFor(() => expect(within(panel()).getByTestId('count-u3').textContent).toBe('3'));
    expect(rowNames()).toEqual(['Unassigned', 'Bruno Lima (me)', 'Carla Dias', 'Ana Souza']);
    expect(within(panel()).getByTestId('count-unassigned').textContent).toBe('2');
    expect(within(panel()).getByTestId('count-u2').textContent).toBe('0');
    expect(orbitService.assigneeCounts).toHaveBeenCalledWith('l1', expect.objectContaining({ statuses: ['doing'], q: 'login' }));
  });

  it('does not ask for counts until the panel opens', async () => {
    renderWithProviders(<AssigneeFilter listId={null} />);
    await screen.findByRole('button', { name: 'Me' });
    expect(orbitService.assigneeCounts).not.toHaveBeenCalled();
    openPanel();
    await waitFor(() => expect(orbitService.assigneeCounts).toHaveBeenCalledWith(null, expect.anything()));
  });

  it('searches by name or email and says when no one matches', async () => {
    renderWithProviders(<AssigneeFilter listId="l1" />);
    await screen.findByRole('button', { name: 'Me' });
    openPanel();
    await within(panel()).findByRole('checkbox', { name: 'Carla Dias' });
    const search = within(panel()).getByRole('textbox', { name: 'Search by name or email' });
    fireEvent.change(search, { target: { value: 'EMPRESA' } });
    expect(rowNames()).toEqual(['Carla Dias']);
    fireEvent.change(search, { target: { value: 'unass' } });
    expect(rowNames()).toEqual(['Unassigned']);
    fireEvent.change(search, { target: { value: 'nobody' } });
    expect(within(panel()).getByText('No one found')).toBeTruthy();
  });

  it('checks people and unassigned into the filters, counts them on the button and clears them', async () => {
    renderWithProviders(<AssigneeFilter listId="l1" />);
    await screen.findByRole('button', { name: 'Me' });
    openPanel();
    fireEvent.click(await within(panel()).findByRole('checkbox', { name: 'Carla Dias' }));
    fireEvent.click(within(panel()).getByRole('checkbox', { name: 'Unassigned' }));
    expect(useUiStore.getState().filters.assigneeIds).toEqual(['u3']);
    expect(useUiStore.getState().filters.unassigned).toBe(true);
    expect(screen.getByRole('button', { name: 'Assignees, 2 selected' })).toBeTruthy();
    fireEvent.click(within(panel()).getByRole('checkbox', { name: 'Carla Dias' }));
    expect(useUiStore.getState().filters.assigneeIds).toEqual([]);
    fireEvent.click(within(panel()).getByRole('checkbox', { name: 'Carla Dias' }));
    fireEvent.click(within(panel()).getByRole('button', { name: 'Clear' }));
    expect(useUiStore.getState().filters).toMatchObject({ assigneeIds: [], unassigned: false });
  });

  it('keeps guests and disabled people out of the list unless the disabled one is already chosen', async () => {
    useUiStore.setState({ filters: { ...EMPTY_FILTERS, assigneeIds: ['u5'] } });
    renderWithProviders(<AssigneeFilter listId="l1" />);
    await screen.findByRole('button', { name: 'Me' });
    openPanel();
    await within(panel()).findByRole('checkbox', { name: 'Old Person' });
    expect(rowNames()).not.toContain('Guest Person');
  });

  it('toggles only my tasks with the Me button, replacing other people and unassigned', async () => {
    useUiStore.setState({ filters: { ...EMPTY_FILTERS, assigneeIds: ['u3'], unassigned: true } });
    renderWithProviders(<AssigneeFilter listId="l1" />);
    const me = await screen.findByRole('button', { name: 'Me' });
    await waitFor(() => expect((me as HTMLButtonElement).disabled).toBe(false));
    expect(me.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(me);
    expect(useUiStore.getState().filters).toMatchObject({ assigneeIds: ['u2'], unassigned: false });
    expect(me.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(me);
    expect(useUiStore.getState().filters.assigneeIds).toEqual([]);
  });

  it('shows nothing to a guest and never asks for counts', async () => {
    meAs(3);
    const { container } = renderWithProviders(<AssigneeFilter listId="l1" />);
    await waitFor(() => expect(orbitService.me).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(container.textContent).toBe('');
    expect(orbitService.assigneeCounts).not.toHaveBeenCalled();
  });
});
