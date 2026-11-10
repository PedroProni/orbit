// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { adminSpace, principal } from '../helpers/admin-fixtures';
import { AdminShell } from '@/components/admin/admin-shell';
import { FormsAdminPage } from '@/components/admin/forms-admin-page';
import { formService } from '@/services/form.service';
import { AdminForm } from '@/services/form.types';
import { orbitService } from '@/services/orbit.service';
import { useSessionStore } from '@/stores/session.store';

vi.mock('next/navigation', () => ({ usePathname: () => '/admin/forms', useParams: () => ({}), useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));

const form = (over: Partial<AdminForm>): AdminForm => ({
  id: 'f1',
  listId: 'l1',
  name: 'Pedidos',
  publicKey: 'chave-1',
  fields: [
    { id: 'campo-titulo', label: 'Assunto', required: true, target: 'title' },
    { id: 'campo-detalhe', label: 'Detalhes', required: false, target: 'description' },
  ],
  active: true,
  paused: false,
  ownerId: 'u1',
  updatedAt: '2026-11-08T10:00:00.000Z',
  ...over,
});

const OPEN = form({});
const PAUSED = form({ id: 'f2', name: 'Suporte', publicKey: 'chave-2', paused: true, ownerId: 'u9' });
const OFF = form({ id: 'f3', name: 'Antigo', publicKey: 'chave-3', active: false });

const rowOf = (name: string) => screen.getByText(name, { selector: 'p' }).closest('li') as HTMLElement;
const dialog = () => screen.getByRole('dialog');

const setup = async (list: AdminForm[] = [OPEN, PAUSED, OFF]) => {
  vi.spyOn(formService, 'list').mockResolvedValue(list);
  renderWithProviders(
    <AdminShell>
      <FormsAdminPage />
    </AdminShell>,
  );
  if (list.length) await screen.findByText(list[0].name, { selector: 'p' });
};

describe('forms administration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useSessionStore.setState({ authenticated: true, hydrated: true });
    vi.spyOn(orbitService, 'me').mockResolvedValue(principal('admin'));
    vi.spyOn(orbitService, 'hierarchy').mockResolvedValue([adminSpace()]);
  });
  afterEach(() => cleanup());

  it.each(['member', 'viewer', 'guest'])('refuses a %s and never asks for the forms', async (role) => {
    vi.spyOn(orbitService, 'me').mockResolvedValue(principal(role));
    const list = vi.spyOn(formService, 'list').mockResolvedValue([OPEN]);
    renderWithProviders(
      <AdminShell>
        <FormsAdminPage />
      </AdminShell>,
    );
    expect(await screen.findByText('You do not have access to this page')).toBeTruthy();
    expect(list).not.toHaveBeenCalled();
  });

  it('lists templates, forms and API tokens in the admin navigation', async () => {
    await setup();
    const nav = screen.getByRole('navigation', { name: 'Administration sections' });
    expect(within(nav).getByRole('link', { name: 'Templates' }).getAttribute('href')).toBe('/admin/templates');
    expect(within(nav).getByRole('link', { name: 'Forms' }).getAttribute('aria-current')).toBe('page');
    expect(within(nav).getByRole('link', { name: 'API tokens' }).getAttribute('href')).toBe('/admin/api-tokens');
    expect(nav.textContent).toContain('Integrations');
  });

  it('flags a paused form with what the admin must do, and tells open from off', async () => {
    await setup();
    expect(within(rowOf('Suporte')).getByText('Paused')).toBeTruthy();
    expect(within(rowOf('Suporte')).getByText(/Save it to take it over and reopen the link/)).toBeTruthy();
    expect(within(rowOf('Pedidos')).getByText('Accepting answers')).toBeTruthy();
    expect(within(rowOf('Pedidos')).queryByText(/Save it to take it over/)).toBeNull();
    expect(within(rowOf('Antigo')).getByText('Off')).toBeTruthy();
    expect(within(rowOf('Pedidos')).getByText('Engineering / Backlog list')).toBeTruthy();
    expect(within(rowOf('Pedidos')).getByText('2 fields')).toBeTruthy();
  });

  it('copies the public link of a form', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    await setup();
    fireEvent.click(within(rowOf('Pedidos')).getByRole('button', { name: 'Copy the public link of Pedidos' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/f/chave-1`));
    expect(await within(rowOf('Pedidos')).findByText('Copied')).toBeTruthy();
  });

  it('keeps the ids of existing fields when the form is edited, so open pages keep working', async () => {
    const update = vi.spyOn(formService, 'update').mockResolvedValue(OPEN);
    await setup();
    fireEvent.click(within(rowOf('Pedidos')).getByRole('button', { name: 'Edit Pedidos' }));
    fireEvent.change(within(dialog()).getByLabelText('Label of field 1'), { target: { value: 'Assunto do pedido' } });
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Add field' }));
    fireEvent.change(within(dialog()).getByLabelText('Label of field 3'), { target: { value: 'Telefone' } });
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(update).toHaveBeenCalled());
    expect(update.mock.calls[0]).toEqual([
      'f1',
      {
        name: 'Pedidos',
        listId: 'l1',
        active: true,
        fields: [
          { id: 'campo-titulo', label: 'Assunto do pedido', required: true, target: 'title' },
          { id: 'campo-detalhe', label: 'Detalhes', required: false, target: 'description' },
          { label: 'Telefone', required: false, target: 'description' },
        ],
      },
    ]);
  });

  it('refuses to save a form without a required title field', async () => {
    const update = vi.spyOn(formService, 'update').mockResolvedValue(OPEN);
    await setup();
    fireEvent.click(within(rowOf('Pedidos')).getByRole('button', { name: 'Edit Pedidos' }));
    fireEvent.click(within(dialog()).getAllByRole('checkbox', { name: 'Required' })[0]);
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Save' }));
    expect(await within(dialog()).findByText('Add a required field that goes to the task title.')).toBeTruthy();
    expect(update).not.toHaveBeenCalled();
  });

  it('creates a form on the first list with one required title field ready', async () => {
    const create = vi.spyOn(formService, 'create').mockResolvedValue(OPEN);
    await setup([]);
    expect(await screen.findByText('No forms yet')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'New form' }));
    fireEvent.change(within(dialog()).getByLabelText('Name'), { target: { value: 'Contato' } });
    fireEvent.change(within(dialog()).getByLabelText('Label of field 1'), { target: { value: 'Assunto' } });
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(create).toHaveBeenCalledWith({ name: 'Contato', listId: 'l1', active: true, fields: [{ label: 'Assunto', required: true, target: 'title' }] }));
  });

  it('warns that saving a paused form makes the admin its owner', async () => {
    await setup();
    fireEvent.click(within(rowOf('Suporte')).getByRole('button', { name: 'Edit Suporte' }));
    expect(within(dialog()).getByRole('note').textContent).toContain('Saving makes you its owner and reopens the public link.');
  });

  it('changes the public link only after confirming', async () => {
    const rotate = vi.spyOn(formService, 'rotateKey').mockResolvedValue(form({ publicKey: 'nova' }));
    await setup();
    fireEvent.click(within(rowOf('Pedidos')).getByRole('button', { name: 'Change the link of Pedidos' }));
    expect(within(dialog()).getByText('Create a new link for "Pedidos"? The current link stops working right away.')).toBeTruthy();
    expect(rotate).not.toHaveBeenCalled();
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Change link' }));
    await waitFor(() => expect(rotate).toHaveBeenCalledWith('f1'));
  });

  it('deletes a form only after confirming', async () => {
    const remove = vi.spyOn(formService, 'remove').mockResolvedValue(undefined);
    await setup();
    fireEvent.click(within(rowOf('Antigo')).getByRole('button', { name: 'Delete Antigo' }));
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(remove).toHaveBeenCalledWith('f3'));
  });
});
