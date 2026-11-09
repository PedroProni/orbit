// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { chooseOption } from '../helpers/choose-option';
import { adminSpace, DEFAULTS, principal } from '../helpers/admin-fixtures';
import { StatusesAdminPage } from '@/components/admin/statuses-admin-page';
import { moveStatus, statusDraftProblem, toStatusInputs } from '@/components/admin/statuses.helpers';
import { ApiError } from '@/lib/api-client';
import { adminService } from '@/services/admin.service';
import { orbitService } from '@/services/orbit.service';
import { useSessionStore } from '@/stores/session.store';
import { SpaceNode } from '@/types/api.types';

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/statuses',
  useParams: () => ({}),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

const open = async (spaces: SpaceNode[] = [adminSpace()]) => {
  vi.spyOn(orbitService, 'me').mockResolvedValue(principal('admin'));
  vi.spyOn(orbitService, 'hierarchy').mockResolvedValue(spaces);
  renderWithProviders(<StatusesAdminPage />);
  return screen.findByRole('region', { name: 'Default statuses' });
};

const defaultsOnly = DEFAULTS.map(({ name, color, type }) => ({
  name,
  color,
  type,
}));

describe('statuses and rules screen', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useSessionStore.setState({ authenticated: true, hydrated: true });
  });
  afterEach(() => cleanup());

  it('shows the seven defaults locked, with no field to edit them', async () => {
    const section = await open();
    expect(within(section).getAllByLabelText('Default status, it cannot be changed')).toHaveLength(7);
    expect(within(section).getByText('In development')).toBeTruthy();
    expect(within(section).getAllByRole('textbox')).toHaveLength(1);
    expect(within(section).getByRole('textbox', { name: 'Name of status 8' })).toBeTruthy();
    expect(within(section).queryByRole('button', { name: 'Remove In development' })).toBeNull();
  });

  it('adds an extra status after the defaults and saves the whole list', async () => {
    const update = vi.spyOn(adminService, 'updateSpace').mockResolvedValue(adminSpace());
    const section = await open();
    fireEvent.click(within(section).getByRole('button', { name: 'Add status' }));
    fireEvent.change(within(section).getByRole('textbox', { name: 'Name of status 9' }), { target: { value: ' QA ' } });
    chooseOption(within(section).getByRole('combobox', { name: 'Stage of QA' }), 'In review');
    fireEvent.click(within(within(section).getByRole('radiogroup', { name: 'Color of QA' })).getByRole('radio', { name: 'Color 2' }));
    fireEvent.click(within(section).getByRole('button', { name: 'Save statuses' }));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    const statuses = update.mock.calls[0][1].statuses ?? [];
    expect(statuses.slice(0, 7)).toEqual(defaultsOnly);
    expect(statuses.slice(7)).toEqual([
      { name: 'blocked by client', color: '#ec4899', type: 'active' },
      { name: 'QA', color: '#60a5fa', type: 'review' },
    ]);
  });

  it('moves extras only among themselves and never above the defaults', async () => {
    const section = await open([
      adminSpace({
        statuses: [...DEFAULTS, { name: 'a', color: '#ec4899', type: 'active', order: 7 }, { name: 'b', color: '#ec4899', type: 'active', order: 8 }],
      }),
    ]);
    expect(
      (
        within(section).getByRole('button', {
          name: 'Move a up',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    fireEvent.click(within(section).getByRole('button', { name: 'Move b up' }));
    expect(
      (
        within(section).getByRole('textbox', {
          name: 'Name of status 8',
        }) as HTMLInputElement
      ).value,
    ).toBe('b');
  });

  it('refuses a repeated name before calling the server', async () => {
    const update = vi.spyOn(adminService, 'updateSpace');
    const section = await open();
    fireEvent.change(within(section).getByRole('textbox', { name: 'Name of status 8' }), { target: { value: 'Backlog' } });
    fireEvent.click(within(section).getByRole('button', { name: 'Save statuses' }));
    expect(within(section).getByRole('alert').textContent).toBe('Each status needs a different name, also different from the defaults.');
    expect(update).not.toHaveBeenCalled();
  });

  it('shows the server refusal when a removed status is still in use', async () => {
    vi.spyOn(adminService, 'updateSpace').mockRejectedValue(new ApiError(400, 'Cannot remove a status that is in use'));
    const section = await open();
    fireEvent.click(within(section).getByRole('button', { name: 'Remove blocked by client' }));
    fireEvent.click(within(section).getByRole('button', { name: 'Save statuses' }));
    expect((await within(section).findByRole('alert')).textContent).toBe('A status you removed is still used by tasks. Move those tasks to another status first.');
  });

  it('saves required tags and title prefixes', async () => {
    const update = vi.spyOn(adminService, 'updateSpace').mockResolvedValue(adminSpace());
    await open([adminSpace({ titlePrefixes: ['[P4T]'] })]);
    const rules = screen.getByRole('region', { name: 'Rules for new tasks' });
    fireEvent.change(within(rules).getByLabelText('Required tags'), {
      target: { value: 'bko' },
    });
    fireEvent.keyDown(within(rules).getByLabelText('Required tags'), {
      key: 'Enter',
    });
    fireEvent.click(within(rules).getByRole('button', { name: 'Remove [P4T]' }));
    fireEvent.click(within(rules).getByRole('button', { name: 'Save rules' }));
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith('s1', {
        requiredTags: ['bko'],
        titlePrefixes: [],
      }),
    );
  });

  it('asks for a space first when there is none', async () => {
    vi.spyOn(orbitService, 'me').mockResolvedValue(principal('owner'));
    vi.spyOn(orbitService, 'hierarchy').mockResolvedValue([]);
    renderWithProviders(<StatusesAdminPage />);
    expect(await screen.findByText('Create a space first in Spaces, folders and lists.')).toBeTruthy();
  });
});

describe('status draft rules', () => {
  const draft = toStatusInputs([...DEFAULTS, { name: 'x', color: '#ec4899', type: 'active', order: 7 }, { name: 'y', color: '#ec4899', type: 'active', order: 8 }]);

  it('never moves a default status', () => {
    expect(moveStatus(draft, 6, 1)).toBe(draft);
    expect(moveStatus(draft, 7, -1)).toBe(draft);
    expect(moveStatus(draft, 8, 1)).toBe(draft);
    expect(
      moveStatus(draft, 8, -1)
        .map((s) => s.name)
        .slice(7),
    ).toEqual(['y', 'x']);
  });

  it('flags empty and repeated names, ignoring case and spaces', () => {
    expect(statusDraftProblem([...draft, { name: '  ', color: '#ec4899', type: 'active' }])).toBe('nameMissing');
    expect(statusDraftProblem([...draft, { name: ' COMPLETED ', color: '#ec4899', type: 'done' }])).toBe('nameRepeated');
    expect(statusDraftProblem(draft)).toBeNull();
  });
});
