// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { MEMBERS, makeSpace, makeTask } from '../helpers/fixtures';
import { CreateTaskDialog } from '@/components/tasks/create-task/create-task-dialog';
import { Toaster } from '@/components/ui/toaster';
import { orbitService } from '@/services/orbit.service';
import { workspaceService } from '@/services/workspace.service';
import { useCreateTaskStore } from '@/stores/create-task.store';
import { useRecentListsStore } from '@/stores/recent-lists.store';
import { useSessionStore } from '@/stores/session.store';
import { useToastStore } from '@/stores/toast.store';
import { useUiStore } from '@/stores/ui.store';

const nav = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: nav.push }) }));
vi.mock('@/lib/upload', () => ({ putWithProgress: vi.fn().mockResolvedValue(undefined) }));

const LISTS = [
  { id: 'l1', spaceId: 's1', folderId: null, name: 'Backlog', kind: 'list' as const },
  { id: 'l2', spaceId: 's1', folderId: null, name: 'Sprint 3', kind: 'sprint' as const },
];
const space = makeSpace({ titlePrefixes: ['ENG'], requiredTags: ['P4T'], lists: LISTS });
const created = (over = {}) => makeTask({ id: 'n1', title: '[ENG] Nova', listId: 'l1', ...over });

const open = (defaults: { listId: string | null; status?: string } = { listId: 'l1' }, role = 'member') => {
  vi.spyOn(orbitService, 'me').mockResolvedValue({ ...MEMBERS[0], role, workspaceId: 'w', scopes: [] } as never);
  act(() => useCreateTaskStore.getState().show(defaults));
  return renderWithProviders(
    <>
      <CreateTaskDialog />
      <Toaster />
    </>,
  );
};

const titleBox = async () => (await screen.findByRole('textbox', { name: 'Task name' })) as HTMLTextAreaElement;
const typeTitle = (input: HTMLTextAreaElement, value: string) => fireEvent.change(input, { target: { value, selectionStart: value.length } });
const createButton = () => screen.getByRole('button', { name: 'Create Task' }) as HTMLButtonElement;

describe('the + Task modal', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    nav.push.mockReset();
    useSessionStore.setState({ authenticated: true, hydrated: true });
    useToastStore.setState({ items: [] });
    useCreateTaskStore.setState({ open: false, session: 0, defaults: { listId: null } });
    localStorage.clear();
    useRecentListsStore.setState({ listIds: [], hydrated: false });
    vi.spyOn(orbitService, 'members').mockResolvedValue(MEMBERS);
    vi.spyOn(orbitService, 'hierarchy').mockResolvedValue([space]);
    vi.spyOn(workspaceService, 'templates').mockResolvedValue([]);
  });

  it('shows nothing to a guest', async () => {
    open({ listId: 'l1' }, 'guest');
    await waitFor(() => expect(orbitService.me).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.queryByRole('dialog', { name: 'Create' })).toBeNull();
  });

  it('opens on the current list with the Task and Doc tabs, the type chip and a single required tag already chosen', async () => {
    open();
    const dialog = await screen.findByRole('dialog', { name: 'Create' });
    expect(within(dialog).getByRole('tab', { name: 'Task' }).getAttribute('aria-selected')).toBe('true');
    expect(within(dialog).getByRole('tab', { name: 'Doc' })).toBeTruthy();
    await waitFor(() => expect(within(dialog).getByRole('button', { name: /Backlog/ })).toBeTruthy());
    expect(within(dialog).getByRole('button', { name: 'Task type' })).toBeTruthy();
    expect(within(dialog).getByRole('button', { name: 'Tags' }).textContent).toBe('1');
    expect(createButton().disabled).toBe(true);
  });

  it('asks for a list first when opened from outside a list, and enables Create once one is picked', async () => {
    const create = vi.spyOn(orbitService, 'createTask').mockResolvedValue(created({ listId: 'l2' }));
    open({ listId: null });
    const title = await titleBox();
    expect(screen.getByText('Pick a list to create the task in')).toBeTruthy();
    typeTitle(title, 'Nova');
    expect(createButton().disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /Select List/ }));
    fireEvent.click(await screen.findByRole('option', { name: 'Sprint 3' }));
    expect(createButton().disabled).toBe(false);
    expect(screen.getByRole('button', { name: 'Tags' }).textContent).toBe('1');
    fireEvent.click(screen.getByRole('button', { name: '[ENG]' }));
    fireEvent.click(createButton());
    await waitFor(() => expect(create).toHaveBeenCalledWith('l2', { title: '[ENG] Nova', tags: ['p4t'], assigneeIds: [] }));
  });

  it('runs the / commands from the keyboard: filters them, Assign to me assigns me and drops the typed command', async () => {
    open();
    const title = await titleBox();
    typeTitle(title, 'Nova /assi');
    const menu = await screen.findByRole('listbox', { name: 'Commands' });
    expect(
      within(menu)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Assign', 'Assign to me']);
    fireEvent.keyDown(title, { key: 'ArrowDown' });
    expect(within(menu).getByRole('option', { name: 'Assign to me' }).getAttribute('aria-selected')).toBe('true');
    await waitFor(() => expect(orbitService.me).toHaveBeenCalled());
    fireEvent.keyDown(title, { key: 'Enter' });
    expect(title.value).toBe('Nova ');
    expect(screen.queryByRole('listbox', { name: 'Commands' })).toBeNull();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Assignees' }).textContent).toContain('AS'));
  });

  it('opens the subtask section and the task type picker from / commands, and says when nothing matches', async () => {
    open();
    const title = await titleBox();
    typeTitle(title, '/sub');
    fireEvent.click(within(await screen.findByRole('listbox', { name: 'Commands' })).getByRole('option', { name: 'Subtask' }));
    expect(screen.getByRole('region', { name: 'Subtasks' })).toBeTruthy();
    typeTitle(title, '/xyz');
    expect(await screen.findByText('No command found')).toBeTruthy();
    typeTitle(title, '/type');
    fireEvent.click(within(await screen.findByRole('listbox', { name: 'Commands' })).getByRole('option', { name: 'Task type' }));
    expect(screen.getByRole('menuitem', { name: 'Bug' })).toBeTruthy();
  });

  it('refuses a title without the space prefix before calling the API', async () => {
    const create = vi.spyOn(orbitService, 'createTask');
    open();
    const title = await titleBox();
    await waitFor(() => expect(screen.getByRole('button', { name: /Backlog/ })).toBeTruthy());
    typeTitle(title, 'sem prefixo');
    fireEvent.submit(title.closest('form') as HTMLFormElement);
    expect(create).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toContain('[ENG]');
  });

  it('creates with description, followers, subtasks exactly as typed (the space rules only bind the parent), a checklist and a blocker, then announces it', async () => {
    const create = vi.spyOn(orbitService, 'createTask').mockImplementation(async (_listId, input) => created({ id: input.parentId ? 'sub' : 'n1', title: input.title }));
    const update = vi.spyOn(orbitService, 'updateTask').mockResolvedValue(created());
    const depend = vi.spyOn(workspaceService, 'addDependency').mockResolvedValue({} as never);
    vi.spyOn(orbitService, 'search').mockResolvedValue({ tasks: [makeTask({ id: 'b1', title: 'Bloqueio' })], comments: [] });
    open({ listId: 'l1', status: 'doing' });
    const title = await titleBox();
    await waitFor(() => expect(screen.getByRole('button', { name: /Backlog/ })).toBeTruthy());
    typeTitle(title, '[ENG] Nova');
    fireEvent.change(screen.getByRole('textbox', { name: 'Description' }), { target: { value: 'Detalhes' } });
    fireEvent.click(screen.getByRole('button', { name: 'No followers' }));
    fireEvent.click(await screen.findByRole('option', { name: /Bruno Lima/ }));
    expect(screen.getByRole('button', { name: '1 follower' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '1 follower' }));
    for (const extra of ['Subtasks', 'Checklist', 'Dependencies']) {
      fireEvent.click(screen.getByRole('button', { name: 'More fields' }));
      fireEvent.click(screen.getByRole('menuitem', { name: extra }));
    }
    const subtask = screen.getByRole('textbox', { name: 'Add a subtask and press Enter' });
    fireEvent.change(subtask, { target: { value: 'Parte A' } });
    fireEvent.keyDown(subtask, { key: 'Enter' });
    const item = screen.getByRole('textbox', { name: 'Add an item and press Enter' });
    fireEvent.change(item, { target: { value: 'Revisar' } });
    fireEvent.keyDown(item, { key: 'Enter' });
    expect(create).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Add a task that blocks this one' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Search tasks' }), { target: { value: 'Blo' } });
    fireEvent.click(await screen.findByRole('option', { name: 'Bloqueio' }));
    fireEvent.click(createButton());
    await waitFor(() => expect(depend).toHaveBeenCalledWith('n1', 'b1'));
    expect(create.mock.calls[0]).toEqual(['l1', { title: '[ENG] Nova', status: 'doing', tags: ['p4t'], assigneeIds: [], descriptionMd: 'Detalhes', watcherIds: ['u2'] }]);
    expect(create.mock.calls[1]).toEqual(['l1', { title: 'Parte A', parentId: 'n1' }]);
    expect(update.mock.calls[0][1].checklists?.[0].items.map((entry) => entry.name)).toEqual(['Revisar']);
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Create' })).toBeNull());
    expect(screen.getByText('Task created: [ENG] Nova in Backlog')).toBeTruthy();
    expect(useToastStore.getState().items.some((entry) => entry.kind === 'error')).toBe(false);
    expect(useRecentListsStore.getState().listIds[0]).toBe('l1');
  });

  it('keeps the task and lists the parts that failed when an extra is refused', async () => {
    vi.spyOn(orbitService, 'createTask').mockResolvedValue(created());
    vi.spyOn(orbitService, 'updateTask').mockRejectedValue(new Error('boom'));
    open();
    const title = await titleBox();
    await waitFor(() => expect(screen.getByRole('button', { name: /Backlog/ })).toBeTruthy());
    typeTitle(title, '[ENG] Nova');
    fireEvent.click(screen.getByRole('button', { name: 'More fields' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Checklist' }));
    const item = screen.getByRole('textbox', { name: 'Add an item and press Enter' });
    fireEvent.change(item, { target: { value: 'Revisar' } });
    fireEvent.keyDown(item, { key: 'Enter' });
    fireEvent.click(createButton());
    expect(await screen.findByText('The task was created, but these parts failed: checklist')).toBeTruthy();
    expect(screen.getByText('Task created: [ENG] Nova in Backlog')).toBeTruthy();
  });

  it('uploads the attached files after creating and refuses an empty file up front', async () => {
    vi.spyOn(orbitService, 'createTask').mockResolvedValue(created());
    const request = vi.spyOn(orbitService, 'requestUpload').mockResolvedValue({ id: 'a1', uploadUrl: 'https://upload.test/a1' } as never);
    const confirm = vi.spyOn(orbitService, 'confirmUpload').mockResolvedValue({} as never);
    open();
    const title = await titleBox();
    await waitFor(() => expect(screen.getByRole('button', { name: /Backlog/ })).toBeTruthy());
    typeTitle(title, '[ENG] Nova');
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['abc'], 'nota.txt', { type: 'text/plain' }), new File([], 'vazio.txt', { type: 'text/plain' })] } });
    expect(within(screen.getByRole('region', { name: 'Attachments' })).getByText('nota.txt')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('vazio.txt');
    fireEvent.click(createButton());
    await waitFor(() => expect(confirm).toHaveBeenCalledWith('a1'));
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][1]).toMatchObject({ filename: 'nota.txt', sizeBytes: 3 });
  });

  it('never drops a typed task on Escape: asks, Escape again keeps editing, Enter does not create while asking, Discard closes', async () => {
    const create = vi.spyOn(orbitService, 'createTask');
    open();
    const title = await titleBox();
    await waitFor(() => expect(screen.getByRole('button', { name: /Backlog/ })).toBeTruthy());
    typeTitle(title, '[ENG] Rascunho');
    fireEvent.keyDown(document.activeElement ?? window, { key: 'Escape' });
    expect(screen.getByRole('alertdialog', { name: 'Discard this task?' })).toBeTruthy();
    expect(createButton().disabled).toBe(true);
    fireEvent.submit(title.closest('form') as HTMLFormElement);
    expect(create).not.toHaveBeenCalled();
    fireEvent.keyDown(document.activeElement ?? window, { key: 'Escape' });
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(screen.getByRole('dialog', { name: 'Create' })).toBeTruthy();
    expect(title.value).toBe('[ENG] Rascunho');
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Create' })).getByRole('button', { name: 'Close' }));
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Create' })).toBeNull());
    expect(create).not.toHaveBeenCalled();
  });

  it('closes at once on Escape while nothing was typed', async () => {
    open();
    await titleBox();
    fireEvent.keyDown(document.activeElement ?? window, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Create' })).toBeNull());
    expect(useCreateTaskStore.getState().open).toBe(false);
  });

  it('creates and starts another on the same list, or creates and opens the task', async () => {
    const create = vi.spyOn(orbitService, 'createTask').mockImplementation(async (_listId, input) => created({ title: input.title }));
    open();
    const title = await titleBox();
    await waitFor(() => expect(screen.getByRole('button', { name: /Backlog/ })).toBeTruthy());
    typeTitle(title, '[ENG] Primeira');
    fireEvent.click(screen.getByRole('button', { name: 'More create options' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Create and start another' }));
    await waitFor(() => expect(title.value).toBe('[ENG] '));
    expect(screen.getByRole('dialog', { name: 'Create' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Backlog/ })).toBeTruthy();
    typeTitle(title, '[ENG] Segunda');
    fireEvent.click(screen.getByRole('button', { name: 'More create options' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Create and open' }));
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith('/lists/l1?task=n1'));
    expect(create).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('dialog', { name: 'Create' })).toBeNull();
  });

  it('opens the new task in place when its list is already on screen', async () => {
    window.history.replaceState(null, '', '/lists/l1');
    useUiStore.setState({ openTaskId: null });
    vi.spyOn(orbitService, 'createTask').mockResolvedValue(created());
    open();
    const title = await titleBox();
    await waitFor(() => expect(screen.getByRole('button', { name: /Backlog/ })).toBeTruthy());
    typeTitle(title, '[ENG] Aqui');
    fireEvent.click(screen.getByRole('button', { name: 'More create options' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Create and open' }));
    await waitFor(() => expect(useUiStore.getState().openTaskId).toBe('n1'));
    expect(nav.push).not.toHaveBeenCalled();
    window.history.replaceState(null, '', '/');
  });

  it('fills the form from a template without creating anything, then creates with those values on Create Task', async () => {
    vi.spyOn(workspaceService, 'templates').mockResolvedValue([{ id: 'tp1', spaceId: 's1', name: 'Bug report', titleTemplate: '[ENG] Bug: ', descriptionMd: 'Passos', tags: ['bug'], priority: 'high', taskKind: 'bug', estimateMinutes: null }]);
    const instantiate = vi.spyOn(workspaceService, 'instantiateTemplate');
    const create = vi.spyOn(orbitService, 'createTask').mockResolvedValue(created());
    open();
    const title = await titleBox();
    await waitFor(() => expect(screen.getByRole('button', { name: /Backlog/ })).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Templates' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Bug report' }));
    expect(title.value).toBe('[ENG] Bug: ');
    expect((screen.getByRole('textbox', { name: 'Description' }) as HTMLTextAreaElement).value).toBe('Passos');
    expect(instantiate).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
    typeTitle(title, '[ENG] Bug: login');
    fireEvent.click(createButton());
    await waitFor(() => expect(create).toHaveBeenCalledWith('l1', { title: '[ENG] Bug: login', tags: ['p4t', 'bug'], assigneeIds: [], priority: 'high', taskKind: 'bug', descriptionMd: 'Passos' }));
    expect(instantiate).not.toHaveBeenCalled();
  });

  it('creates a doc from the Doc tab, announces it and opens it', async () => {
    const createDoc = vi.spyOn(workspaceService, 'createDoc').mockResolvedValue({ id: 'd1', title: 'Notas' } as never);
    open();
    await titleBox();
    fireEvent.click(screen.getByRole('tab', { name: 'Doc' }));
    const button = screen.getByRole('button', { name: 'Create Doc' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.change(screen.getByRole('textbox', { name: 'Doc title' }), { target: { value: ' Notas ' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Write something' }), { target: { value: 'Corpo' } });
    fireEvent.click(button);
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith('/docs?doc=d1'));
    expect(createDoc).toHaveBeenCalledWith({ title: 'Notas', bodyMd: 'Corpo' });
    expect(useToastStore.getState().items.map((entry) => entry.messageKey)).toContain('docCreated');
    expect(screen.queryByRole('dialog', { name: 'Create' })).toBeNull();
  });
});
