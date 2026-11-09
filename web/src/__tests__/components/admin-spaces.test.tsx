// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { chooseOption } from '../helpers/choose-option';
import { adminSpace, principal } from '../helpers/admin-fixtures';
import { SpacesAdminPage } from '@/components/admin/spaces-admin-page';
import { listDialogProblem } from '@/components/admin/list-dialog.helpers';
import { ApiError } from '@/lib/api-client';
import { adminService } from '@/services/admin.service';
import { orbitService } from '@/services/orbit.service';
import { useSessionStore } from '@/stores/session.store';
import { FolderNode, ListNode, SpaceNode } from '@/types/api.types';

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/spaces',
  useParams: () => ({}),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

const open = async (spaces: SpaceNode[] = [adminSpace()]) => {
  vi.spyOn(orbitService, 'me').mockResolvedValue(principal('admin'));
  const hierarchy = vi.spyOn(orbitService, 'hierarchy').mockResolvedValue(spaces);
  renderWithProviders(<SpacesAdminPage />);
  return hierarchy;
};

const menuOf = async (name: string) => {
  fireEvent.click(await screen.findByRole('button', { name: `Actions for ${name}` }));
  return screen.getByRole('menu');
};

describe('spaces, folders and lists screen', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useSessionStore.setState({ authenticated: true, hydrated: true });
  });
  afterEach(() => cleanup());

  it('shows each space with its loose lists, folders and sprint dates', async () => {
    await open();
    const space = await screen.findByRole('region', { name: 'Engineering' });
    expect(within(space).getByRole('link', { name: 'Backlog list' }).getAttribute('href')).toBe('/lists/l1');
    expect(within(space).getByRole('heading', { name: 'Q4' })).toBeTruthy();
    expect(within(space).getByText('11/02 to 11/13')).toBeTruthy();
  });

  it('shows the empty state when there is no space', async () => {
    await open([]);
    expect(await screen.findByText('No spaces yet. Create the first one to organize lists.')).toBeTruthy();
  });

  it('creates a space and refetches the tree', async () => {
    const hierarchy = await open();
    const create = vi.spyOn(adminService, 'createSpace').mockResolvedValue(adminSpace({ id: 's2', name: 'Design' }));
    fireEvent.click(await screen.findByRole('button', { name: 'New space' }));
    const dialog = screen.getByRole('dialog', { name: 'New space' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create' }));
    expect(within(dialog).getByRole('alert').textContent).toBe('Type a name');
    fireEvent.change(within(dialog).getByLabelText('Name'), {
      target: { value: '  Design ' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(create).toHaveBeenCalledWith('Design'));
    await waitFor(() => expect(hierarchy).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole('dialog', { name: 'New space' })).toBeNull();
  });

  it('creates a sprint inside a folder and refuses it without dates', async () => {
    await open();
    const create = vi.spyOn(adminService, 'createList').mockResolvedValue({ id: 'l3' } as ListNode);
    fireEvent.click(within(await menuOf('Q4')).getByRole('menuitem', { name: 'New sprint' }));
    const dialog = screen.getByRole('dialog', { name: 'New sprint' });
    fireEvent.change(within(dialog).getByLabelText('Name'), {
      target: { value: 'Sprint 13' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create' }));
    expect(within(dialog).getByRole('alert').textContent).toBe('A sprint needs a start and an end date.');
    expect(create).not.toHaveBeenCalled();
  });

  it('moves a list to another folder', async () => {
    await open();
    const update = vi.spyOn(adminService, 'updateList').mockResolvedValue({ id: 'l1' } as ListNode);
    fireEvent.click(
      within(await menuOf('Backlog list')).getByRole('menuitem', {
        name: 'Edit',
      }),
    );
    const dialog = screen.getByRole('dialog', { name: 'Edit list' });
    chooseOption(within(dialog).getByRole('combobox', { name: 'Folder' }), 'Q4');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith('l1', {
        name: 'Backlog list',
        folderId: 'f1',
        startDate: null,
        endDate: null,
      }),
    );
  });

  it('renames a folder', async () => {
    await open();
    const rename = vi.spyOn(adminService, 'renameFolder').mockResolvedValue({ id: 'f1' } as FolderNode);
    fireEvent.click(within(await menuOf('Q4')).getByRole('menuitem', { name: 'Rename' }));
    const dialog = screen.getByRole('dialog', { name: 'Rename folder' });
    fireEvent.change(within(dialog).getByLabelText('Name'), {
      target: { value: 'Q1' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(rename).toHaveBeenCalledWith('f1', 'Q1'));
  });

  it('keeps the dialog open with the translated refusal when the list still has tasks', async () => {
    await open();
    vi.spyOn(adminService, 'deleteList').mockRejectedValue(new ApiError(400, 'List is not empty'));
    fireEvent.click(
      within(await menuOf('Backlog list')).getByRole('menuitem', {
        name: 'Delete list',
      }),
    );
    const dialog = screen.getByRole('dialog', { name: 'Delete list' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    expect((await within(dialog).findByRole('alert')).textContent).toBe('This list still has tasks. Move or delete them first.');
  });

  it('shows the folder refusal in Portuguese', async () => {
    vi.spyOn(orbitService, 'me').mockResolvedValue(principal('owner'));
    vi.spyOn(orbitService, 'hierarchy').mockResolvedValue([adminSpace()]);
    vi.spyOn(adminService, 'deleteFolder').mockRejectedValue(new ApiError(400, 'Folder is not empty'));
    renderWithProviders(<SpacesAdminPage />, 'pt');
    fireEvent.click(await screen.findByRole('button', { name: 'Ações de Q4' }));
    fireEvent.click(
      within(screen.getByRole('menu')).getByRole('menuitem', {
        name: 'Excluir pasta',
      }),
    );
    const dialog = screen.getByRole('dialog', { name: 'Excluir pasta' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Excluir' }));
    expect((await within(dialog).findByRole('alert')).textContent).toContain('Esta pasta ainda tem listas');
  });
});

describe('list dialog rules', () => {
  it('asks for a name, sprint dates on create and dates in order', () => {
    expect(listDialogProblem({ name: ' ', kind: 'list' }, true)).toBe('nameRequired');
    expect(listDialogProblem({ name: 'S', kind: 'sprint', startDate: '2026-11-02', endDate: null }, true)).toBe('datesRequired');
    expect(listDialogProblem({ name: 'S', kind: 'sprint', startDate: null, endDate: null }, false)).toBeNull();
    expect(
      listDialogProblem(
        {
          name: 'S',
          kind: 'sprint',
          startDate: '2026-11-10',
          endDate: '2026-11-02',
        },
        true,
      ),
    ).toBe('datesOrder');
    expect(listDialogProblem({ name: 'L', kind: 'list' }, true)).toBeNull();
  });
});
