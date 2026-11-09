// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { chooseOption } from '../helpers/choose-option';
import { MEMBERS } from '../helpers/fixtures';
import { adminSpace, principal } from '../helpers/admin-fixtures';
import { CustomFieldsAdminPage } from '@/components/admin/custom-fields-admin-page';
import { GroupsAdminPage } from '@/components/admin/groups-admin-page';
import { customFieldProblem } from '@/components/admin/custom-field.helpers';
import { ApiError } from '@/lib/api-client';
import { adminService } from '@/services/admin.service';
import { orbitService } from '@/services/orbit.service';
import { useSessionStore } from '@/stores/session.store';
import { CustomFieldDefinition } from '@/types/api.types';

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/custom-fields',
  useParams: () => ({}),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

const FIELD: CustomFieldDefinition = {
  id: 'cf1',
  spaceId: 's1',
  name: 'Customer',
  type: 'dropdown',
  options: [
    { id: 'o1', label: 'P4T', color: '#000000' },
    { id: 'o2', label: 'MTB', color: '#ffffff' },
  ],
};

describe('custom fields screen', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useSessionStore.setState({ authenticated: true, hydrated: true });
    vi.spyOn(orbitService, 'me').mockResolvedValue(principal('admin'));
    vi.spyOn(orbitService, 'hierarchy').mockResolvedValue([adminSpace()]);
  });
  afterEach(() => cleanup());

  it('lists the fields of the chosen space', async () => {
    vi.spyOn(orbitService, 'customFields').mockResolvedValue([FIELD, { ...FIELD, id: 'cf2', name: 'Spec', type: 'url', options: [] }]);
    renderWithProviders(<CustomFieldsAdminPage />);
    expect(await screen.findByText('Customer')).toBeTruthy();
    expect(screen.getByText('2 options')).toBeTruthy();
    expect(screen.getByText('Link')).toBeTruthy();
  });

  it('asks for options on a list field and creates it with them', async () => {
    vi.spyOn(orbitService, 'customFields').mockResolvedValue([]);
    const create = vi.spyOn(adminService, 'createCustomField').mockResolvedValue(FIELD);
    renderWithProviders(<CustomFieldsAdminPage />);
    expect(await screen.findByText('No custom fields in this space.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'New field' }));
    const dialog = screen.getByRole('dialog', { name: 'New custom field' });
    fireEvent.change(within(dialog).getByLabelText('Name'), {
      target: { value: 'Customer' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create' }));
    expect(within(dialog).getByRole('alert').textContent).toBe('Add at least one option.');
    fireEvent.change(within(dialog).getByLabelText('Options'), {
      target: { value: 'P4T' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create' }));
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith('s1', {
        name: 'Customer',
        type: 'dropdown',
        options: ['P4T'],
      }),
    );
  });

  it('creates a date field without options', async () => {
    vi.spyOn(orbitService, 'customFields').mockResolvedValue([]);
    const create = vi.spyOn(adminService, 'createCustomField').mockResolvedValue(FIELD);
    renderWithProviders(<CustomFieldsAdminPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'New field' }));
    const dialog = screen.getByRole('dialog', { name: 'New custom field' });
    fireEvent.change(within(dialog).getByLabelText('Name'), {
      target: { value: 'Go live' },
    });
    chooseOption(within(dialog).getByRole('combobox', { name: 'Field type' }), 'Date');
    expect(within(dialog).queryByLabelText('Options')).toBeNull();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create' }));
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith('s1', {
        name: 'Go live',
        type: 'date',
        options: [],
      }),
    );
  });

  it('deletes a field after confirming', async () => {
    vi.spyOn(orbitService, 'customFields').mockResolvedValue([FIELD]);
    const remove = vi.spyOn(adminService, 'deleteCustomField').mockResolvedValue(undefined);
    renderWithProviders(<CustomFieldsAdminPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Delete field Customer' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete custom field' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(remove).toHaveBeenCalledWith('cf1'));
  });

  it('validates the field before sending', () => {
    expect(customFieldProblem({ name: ' ', type: 'url', options: [] })).toBe('nameRequired');
    expect(customFieldProblem({ name: 'A', type: 'dropdown', options: [] })).toBe('optionsRequired');
    expect(customFieldProblem({ name: 'A', type: 'date', options: [] })).toBeNull();
  });
});

describe('groups screen', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useSessionStore.setState({ authenticated: true, hydrated: true });
    vi.spyOn(orbitService, 'me').mockResolvedValue(principal('owner'));
    vi.spyOn(orbitService, 'members').mockResolvedValue([
      ...MEMBERS,
      {
        id: 'u3',
        email: 'off@x.io',
        name: 'Off Person',
        avatarUrl: null,
        role: 'member',
        status: 'disabled',
      },
    ]);
  });
  afterEach(() => cleanup());

  it('creates a group with the chosen active people only', async () => {
    vi.spyOn(adminService, 'groups').mockResolvedValue([]);
    const create = vi.spyOn(adminService, 'createGroup').mockResolvedValue({ id: 'g1', name: 'Front', memberIds: ['u2'] });
    renderWithProviders(<GroupsAdminPage />);
    expect(await screen.findByText('No groups yet.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'New group' }));
    const dialog = screen.getByRole('dialog', { name: 'New group' });
    expect(within(dialog).queryByLabelText('Off Person')).toBeNull();
    fireEvent.change(within(dialog).getByLabelText('Name'), {
      target: { value: 'Front' },
    });
    fireEvent.click(await within(dialog).findByLabelText('Bruno Lima'));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(create).toHaveBeenCalledWith({ name: 'Front', memberIds: ['u2'] }));
  });

  it('edits the members of a group and shows a server refusal', async () => {
    vi.spyOn(adminService, 'groups').mockResolvedValue([{ id: 'g1', name: 'Front', memberIds: ['u2'] }]);
    vi.spyOn(adminService, 'updateGroup').mockRejectedValue(new ApiError(404, 'Unknown user in members'));
    renderWithProviders(<GroupsAdminPage />);
    expect(await screen.findByText('1 member')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Edit group Front' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit group' });
    expect((within(dialog).getByLabelText('Bruno Lima') as HTMLInputElement).checked).toBe(true);
    fireEvent.click(within(dialog).getByLabelText('Ana Souza'));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect((await within(dialog).findByRole('alert')).textContent).toBe('This person is not in the workspace');
  });

  it('deletes a group after confirming', async () => {
    vi.spyOn(adminService, 'groups').mockResolvedValue([{ id: 'g1', name: 'Front', memberIds: [] }]);
    const remove = vi.spyOn(adminService, 'deleteGroup').mockResolvedValue(undefined);
    renderWithProviders(<GroupsAdminPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Delete group Front' }));
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Delete group' })).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(remove).toHaveBeenCalledWith('g1'));
  });
});
