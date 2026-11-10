// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { adminSpace, principal } from '../helpers/admin-fixtures';
import { chooseOption } from '../helpers/choose-option';
import { AdminShell } from '@/components/admin/admin-shell';
import { TemplatesAdminPage } from '@/components/admin/templates-admin-page';
import { orbitService } from '@/services/orbit.service';
import { templateService } from '@/services/template.service';
import { useSessionStore } from '@/stores/session.store';
import { TaskTemplate } from '@/types/workspace.types';

vi.mock('next/navigation', () => ({ usePathname: () => '/admin/templates', useParams: () => ({}), useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));

const BUG: TaskTemplate = { id: 't1', spaceId: 's1', name: 'Relato de bug', titleTemplate: 'Bug: ', descriptionMd: 'Passos', tags: ['qa', 'web'], priority: 'high', taskKind: 'bug', estimateMinutes: 45 };
const LOST: TaskTemplate = { id: 't2', spaceId: 'sumiu', name: 'Sem espaço', titleTemplate: 'Algo', descriptionMd: '', tags: [], priority: null, taskKind: 'task', estimateMinutes: null };

const rowOf = (name: string) => screen.getByText(name, { selector: 'p' }).closest('li') as HTMLElement;
const dialog = () => screen.getByRole('dialog');

const setup = async (list: TaskTemplate[] = [BUG, LOST]) => {
  vi.spyOn(templateService, 'list').mockResolvedValue(list);
  renderWithProviders(
    <AdminShell>
      <TemplatesAdminPage />
    </AdminShell>,
  );
  if (list.length) await screen.findByText(list[0].name, { selector: 'p' });
};

describe('templates administration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useSessionStore.setState({ authenticated: true, hydrated: true });
    vi.spyOn(orbitService, 'me').mockResolvedValue(principal('admin'));
    vi.spyOn(orbitService, 'hierarchy').mockResolvedValue([adminSpace()]);
  });
  afterEach(() => cleanup());

  it.each(['member', 'viewer', 'guest'])('refuses a %s and never asks for the templates', async (role) => {
    vi.spyOn(orbitService, 'me').mockResolvedValue(principal(role));
    const list = vi.spyOn(templateService, 'list').mockResolvedValue([BUG]);
    renderWithProviders(
      <AdminShell>
        <TemplatesAdminPage />
      </AdminShell>,
    );
    expect(await screen.findByText('You do not have access to this page')).toBeTruthy();
    expect(list).not.toHaveBeenCalled();
  });

  it('shows the space, type, priority, estimate and tags of each template', async () => {
    await setup();
    const row = rowOf('Relato de bug');
    for (const text of ['Engineering', 'Bug', 'High', '45 minutes', 'qa', 'web']) expect(within(row).getByText(text)).toBeTruthy();
    expect(within(rowOf('Sem espaço')).getByText('Space not found')).toBeTruthy();
    expect(within(rowOf('Sem espaço')).getByText('No priority')).toBeTruthy();
  });

  it('creates a template with trimmed unique tags, priority, type and estimate', async () => {
    const create = vi.spyOn(templateService, 'create').mockResolvedValue(BUG);
    await setup([]);
    expect(await screen.findByText('No templates yet')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'New template' }));
    fireEvent.change(within(dialog()).getByLabelText('Name'), { target: { value: '  Revisão  ' } });
    fireEvent.change(within(dialog()).getByLabelText('Task title'), { target: { value: 'Revisar entrega' } });
    fireEvent.change(within(dialog()).getByLabelText('Tags'), { target: { value: 'a, b, a, ' } });
    chooseOption(within(dialog()).getByRole('combobox', { name: 'Priority' }), 'Urgent');
    chooseOption(within(dialog()).getByRole('combobox', { name: 'Type' }), 'Chore');
    fireEvent.change(within(dialog()).getByLabelText('Estimate (minutes)'), { target: { value: '30' } });
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(create).toHaveBeenCalledWith({ spaceId: 's1', name: 'Revisão', titleTemplate: 'Revisar entrega', descriptionMd: '', tags: ['a', 'b'], priority: 'urgent', taskKind: 'chore', estimateMinutes: 30 }));
  });

  it.each(['1.5', '-3', '600001', 'dez'])('refuses the estimate %s without calling the server', async (estimate) => {
    const create = vi.spyOn(templateService, 'create').mockResolvedValue(BUG);
    await setup([]);
    await screen.findByText('No templates yet');
    fireEvent.click(screen.getByRole('button', { name: 'New template' }));
    fireEvent.change(within(dialog()).getByLabelText('Name'), { target: { value: 'X' } });
    fireEvent.change(within(dialog()).getByLabelText('Task title'), { target: { value: 'Y' } });
    fireEvent.change(within(dialog()).getByLabelText('Estimate (minutes)'), { target: { value: estimate } });
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Create' }));
    expect(await within(dialog()).findByText('The estimate must be a whole number of minutes, up to 600000.')).toBeTruthy();
    expect(create).not.toHaveBeenCalled();
  });

  it('edits a template keeping what was not changed', async () => {
    const update = vi.spyOn(templateService, 'update').mockResolvedValue(BUG);
    await setup();
    fireEvent.click(within(rowOf('Relato de bug')).getByRole('button', { name: 'Edit Relato de bug' }));
    expect((within(dialog()).getByLabelText('Tags') as HTMLInputElement).value).toBe('qa, web');
    fireEvent.change(within(dialog()).getByLabelText('Estimate (minutes)'), { target: { value: '' } });
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(update).toHaveBeenCalledWith('t1', { spaceId: 's1', name: 'Relato de bug', titleTemplate: 'Bug:', descriptionMd: 'Passos', tags: ['qa', 'web'], priority: 'high', taskKind: 'bug', estimateMinutes: null }));
  });

  it('deletes a template only after confirming', async () => {
    const remove = vi.spyOn(templateService, 'remove').mockResolvedValue(undefined);
    await setup();
    fireEvent.click(within(rowOf('Sem espaço')).getByRole('button', { name: 'Delete Sem espaço' }));
    expect(within(dialog()).getByText('Delete "Sem espaço"? Tasks already created from it stay.')).toBeTruthy();
    expect(remove).not.toHaveBeenCalled();
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(remove).toHaveBeenCalledWith('t2'));
  });
});
