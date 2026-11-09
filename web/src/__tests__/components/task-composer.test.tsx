// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import en from '../../../messages/en.json';
import { makeSpace, makeTask, MEMBERS, resetUiStore } from '../helpers/fixtures';
import { TaskComposer } from '@/components/tasks/task-composer';
import { EMPTY_PRESETS } from '@/components/tasks/task-composer.constants';
import { ApiError } from '@/lib/api-client';
import { orbitService } from '@/services/orbit.service';
import { useComposerStore } from '@/stores/composer.store';
import { useToastStore } from '@/stores/toast.store';
import { EMPTY_FILTERS } from '@/stores/ui.constants';
import { useUiStore } from '@/stores/ui.store';
import { SpaceNode, Task, TaskPage } from '@/types/api.types';
import { useSessionStore } from '@/stores/session.store';
import { useRecentListsStore } from '@/stores/recent-lists.store';
import { workspaceService } from '@/services/workspace.service';

const HOME_LISTS = [
  { id: 'l1', spaceId: 's1', folderId: null, name: 'Backlog', kind: 'list' as const },
  { id: 'l2', spaceId: 's1', folderId: null, name: 'Sprint 3', kind: 'sprint' as const },
];
const OTHER = makeSpace({ id: 's2', name: 'Design', titlePrefixes: ['DS'], statuses: [{ name: 'open', color: '#888888', type: 'open', order: 0 }], lists: [{ id: 'l9', spaceId: 's2', folderId: null, name: 'Ideas', kind: 'list' }] });

const setup = (space: SpaceNode = makeSpace(), presets = { ...EMPTY_PRESETS, status: 'doing' }, variant: 'card' | 'row' = 'card') => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  client.setQueryData(['tasks', 'l1', EMPTY_FILTERS], { data: [makeTask()], total: 1 });
  const home = { ...space, lists: space.lists.length ? space.lists : HOME_LISTS };
  client.setQueryData(['hierarchy'], [home, OTHER]);
  act(() => useComposerStore.getState().open('cell', presets));
  const view = render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider locale="en" messages={en}>
        <TaskComposer listId="l1" space={home} label="add" variant={variant} />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
  const page = () => client.getQueryData<TaskPage>(['tasks', 'l1', EMPTY_FILTERS]) as TaskPage;
  return { client, page, view, title: screen.getByLabelText('New task title') as HTMLTextAreaElement };
};

const type = (input: HTMLInputElement | HTMLTextAreaElement, value: string) => fireEvent.change(input, { target: { value } });
const submit = () => fireEvent.submit(screen.getByTestId('task-composer'));
const created = (over: Partial<Task> = {}) => makeTask({ id: 'real', title: 'Nova', status: 'doing', ...over });

describe('TaskComposer', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    vi.restoreAllMocks();
    resetUiStore();
    useComposerStore.getState().close();
    useToastStore.setState({ items: [] });
    useSessionStore.setState({ authenticated: true, hydrated: true });
    vi.spyOn(orbitService, 'me').mockResolvedValue({ ...MEMBERS[0], workspaceId: 'w', scopes: [] } as never);
    vi.spyOn(orbitService, 'members').mockResolvedValue(MEMBERS);
    vi.spyOn(orbitService, 'tasks').mockResolvedValue({ data: [makeTask()], total: 1 } as never);
    vi.spyOn(orbitService, 'hierarchy').mockResolvedValue([makeSpace({ lists: HOME_LISTS }), OTHER]);
    localStorage.clear();
    useRecentListsStore.setState({ listIds: [], hydrated: false });
  });

  it('focuses the title on open', () => {
    const { title } = setup();
    expect(document.activeElement).toBe(title);
  });

  it('creates on Enter with the status of the cell, stays open and clears the title', async () => {
    const create = vi.spyOn(orbitService, 'createTask').mockResolvedValue(created());
    const { title } = setup();
    type(title, ' Nova ');
    submit();
    await waitFor(() => expect(create).toHaveBeenCalled());
    expect(create).toHaveBeenCalledWith('l1', { title: 'Nova', status: 'doing', tags: [], assigneeIds: [] });
    expect(title.value).toBe('');
    expect(useComposerStore.getState().anchor).toBe('cell');
    expect(document.activeElement).toBe(title);
  });

  it('wraps a long title on several lines, turns pasted line breaks into spaces and creates on Enter', async () => {
    const create = vi.spyOn(orbitService, 'createTask').mockResolvedValue(created());
    const { title } = setup();
    expect(title.tagName).toBe('TEXTAREA');
    expect(title.className).toContain('[field-sizing:content]');
    expect(title.className).toContain('break-words');
    type(title, 'Revisar contrato\ncom o jurídico');
    expect(title.value).toBe('Revisar contrato com o jurídico');
    fireEvent.keyDown(title, { key: 'Enter', shiftKey: true });
    await waitFor(() => expect(create).toHaveBeenCalledWith('l1', expect.objectContaining({ title: 'Revisar contrato com o jurídico' })));
  });

  it('adds a temporary card at once and swaps it for the real one', async () => {
    let answer: (task: Task) => void = () => undefined;
    vi.spyOn(orbitService, 'createTask').mockImplementation(
      () =>
        new Promise((resolve) => {
          answer = resolve;
        }),
    );
    const { title, page, client } = setup();
    vi.spyOn(client, 'invalidateQueries').mockResolvedValue();
    type(title, 'Nova');
    submit();
    await waitFor(() => expect(page().data.map((task) => task.title)).toEqual(['Task one', 'Nova']));
    expect(page().data[1].id.startsWith('temp-')).toBe(true);
    expect(page().data[1].status).toBe('doing');
    await act(async () => answer(created()));
    await waitFor(() => expect(page().data.map((task) => task.id)).toEqual(['t1', 'real']));
  });

  it('never shows the card twice when a refetch brought it first', async () => {
    let answer: (task: Task) => void = () => undefined;
    vi.spyOn(orbitService, 'createTask').mockImplementation(
      () =>
        new Promise((resolve) => {
          answer = resolve;
        }),
    );
    const { title, page, client } = setup();
    vi.spyOn(client, 'invalidateQueries').mockResolvedValue();
    type(title, 'Nova');
    submit();
    await waitFor(() => expect(page().data).toHaveLength(2));
    act(() => client.setQueryData(['tasks', 'l1', EMPTY_FILTERS], { ...page(), data: [...page().data, created()] }));
    await act(async () => answer(created()));
    await waitFor(() => expect(page().data.map((task) => task.id)).toEqual(['t1', 'real']));
  });

  it('removes the temporary card on refusal, shows the rule and offers the typed text back', async () => {
    vi.spyOn(orbitService, 'createTask').mockRejectedValue(new ApiError(403, 'Forbidden'));
    const { title, page, client } = setup();
    vi.spyOn(client, 'invalidateQueries').mockResolvedValue();
    type(title, 'Primeira');
    submit();
    expect(title.value).toBe('');
    type(title, 'Segunda');
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('You do not have permission'));
    await waitFor(() => expect(page().data.map((task) => task.id)).toEqual(['t1']));
    expect(title.value).toBe('Segunda');
    fireEvent.click(screen.getByRole('button', { name: 'Restore what I typed' }));
    expect(title.value).toBe('Primeira');
  });

  it('puts the refused text straight back when the field is still empty', async () => {
    vi.spyOn(orbitService, 'createTask').mockRejectedValue(new ApiError(400, 'At least one tag is required: p4t'));
    const { title } = setup();
    type(title, 'Primeira');
    submit();
    await waitFor(() => expect(title.value).toBe('Primeira'));
    expect(screen.queryByRole('button', { name: 'Restore what I typed' })).toBeNull();
  });

  it('does not submit a blank title', () => {
    const create = vi.spyOn(orbitService, 'createTask');
    const { title } = setup();
    type(title, '   ');
    submit();
    expect(create).not.toHaveBeenCalled();
    expect((screen.getByRole('button', { name: /Save/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('closes on Escape and on a click outside only while blank', () => {
    const { title } = setup();
    type(title, 'Rascunho');
    fireEvent.pointerDown(document.body);
    expect(useComposerStore.getState().anchor).toBe('cell');
    type(title, '');
    fireEvent.pointerDown(document.body);
    expect(useComposerStore.getState().anchor).toBeNull();
  });

  it('never drops typed text on Escape: it asks first, Escape again or Keep editing goes back, Discard closes, and Enter does not create while asking', () => {
    const create = vi.spyOn(orbitService, 'createTask');
    const { title } = setup();
    type(title, 'Rascunho');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(useComposerStore.getState().anchor).toBe('cell');
    expect(screen.getByRole('alertdialog', { name: 'Discard this task?' })).toBeTruthy();
    submit();
    expect(create).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(title.value).toBe('Rascunho');
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(useComposerStore.getState().anchor).toBe('cell');
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    expect(useComposerStore.getState().anchor).toBeNull();
    expect(useComposerStore.getState().draft.title).toBe('');
    expect(create).not.toHaveBeenCalled();
  });

  it('closes at once on Escape while blank', () => {
    setup();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(useComposerStore.getState().anchor).toBeNull();
  });

  it('closes an open picker first on Escape, and keeps the composer', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Add priority' }));
    expect(screen.getByRole('dialog', { name: 'Add priority' })).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Add priority' })).toBeNull();
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(useComposerStore.getState().anchor).toBe('cell');
  });

  it('sends the assignees, priority, tags and points chosen from the icons', async () => {
    const create = vi.spyOn(orbitService, 'createTask').mockResolvedValue(created());
    const { title } = setup();
    type(title, 'Nova');
    fireEvent.click(screen.getByRole('button', { name: 'Add assignee' }));
    fireEvent.click(await screen.findByRole('option', { name: /Bruno Lima/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Add assignee' }));
    expect(screen.getByRole('button', { name: 'Add assignee' }).textContent).toContain('Bruno Lima');
    fireEvent.click(screen.getByRole('button', { name: 'Add priority' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Urgent' }));
    expect(screen.getByRole('button', { name: 'Add priority' }).textContent).toContain('Urgent');
    fireEvent.click(screen.getByRole('button', { name: 'Add tag' }));
    const tags = within(screen.getByRole('dialog', { name: 'Add tag' })).getByRole('textbox');
    type(tags as HTMLInputElement, 'NOVA');
    fireEvent.keyDown(tags, { key: 'Enter' });
    const tagsButton = screen.getByRole('button', { name: 'Add tag' });
    expect(tagsButton.textContent).toBe('nova');
    fireEvent.click(tagsButton);
    fireEvent.click(screen.getByRole('button', { name: 'Points' }));
    type(within(screen.getByRole('dialog', { name: 'Points' })).getByRole('spinbutton') as HTMLInputElement, '3');
    submit();
    await waitFor(() => expect(create).toHaveBeenCalled());
    expect(create).toHaveBeenCalledWith('l1', { title: 'Nova', status: 'doing', tags: ['nova'], assigneeIds: ['u2'], priority: 'urgent', points: 3 });
  });

  it('resets what was chosen after creating, back to the presets of the cell', async () => {
    vi.spyOn(orbitService, 'createTask').mockResolvedValue(created());
    const { title } = setup(makeSpace(), { ...EMPTY_PRESETS, status: 'doing', tags: ['fixa'] });
    act(() => useComposerStore.getState().setDraft({ priority: 'low', points: 2 }));
    type(title, 'Nova');
    submit();
    const draft = useComposerStore.getState().draft;
    expect(draft).toMatchObject({ title: '', priority: null, points: null, tags: ['fixa'], assigneeIds: [] });
  });

  it('refuses a missing prefix before calling the API and adds the prefix in one click, keeping it for the next task', async () => {
    const create = vi.spyOn(orbitService, 'createTask').mockResolvedValue(created());
    const { title } = setup(makeSpace({ titlePrefixes: ['P4T', 'SG'] }));
    type(title, 'Nova');
    submit();
    expect(create).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toContain('[P4T], [SG]');
    expect(title.value).toBe('Nova');
    fireEvent.click(screen.getByRole('button', { name: '[SG]' }));
    expect(title.value).toBe('[SG] Nova');
    expect(screen.queryByRole('alert')).toBeNull();
    submit();
    await waitFor(() => expect(create).toHaveBeenCalled());
    expect(title.value).toBe('[SG] ');
    submit();
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('refuses a missing tag before calling the API, opens the tag picker and takes a required tag in one click', async () => {
    const create = vi.spyOn(orbitService, 'createTask').mockResolvedValue(created());
    const { title } = setup(makeSpace({ requiredTags: ['P4T', 'BKO'] }));
    type(title, 'Nova');
    submit();
    expect(create).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toContain('P4T, BKO');
    expect(screen.getByRole('dialog', { name: 'Add tag' })).toBeTruthy();
    expect(screen.getByRole('alert').compareDocumentPosition(screen.getByRole('button', { name: 'Add tag' })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.click(within(screen.getByTestId('task-composer')).getByRole('button', { name: 'BKO' }));
    expect(screen.queryByRole('alert')).toBeNull();
    submit();
    await waitFor(() => expect(create).toHaveBeenCalled());
    expect(create.mock.calls[0][1].tags).toEqual(['bko']);
  });

  it('warns when the new task is hidden by the active filters', async () => {
    useUiStore.setState({ filters: { ...EMPTY_FILTERS, tags: ['outra'] } });
    vi.spyOn(orbitService, 'createTask').mockResolvedValue(created());
    const { title } = setup();
    type(title, 'Nova');
    submit();
    await waitFor(() => expect(useToastStore.getState().items.map((item) => item.messageKey)).toContain('createdHidden'));
  });

  it('does not warn when the new task matches the filters', async () => {
    const create = vi.spyOn(orbitService, 'createTask').mockResolvedValue(created());
    const { title } = setup();
    type(title, 'Nova');
    submit();
    await waitFor(() => expect(create).toHaveBeenCalled());
    await act(async () => {
      await Promise.resolve();
    });
    expect(useToastStore.getState().items.map((item) => item.messageKey)).not.toContain('createdHidden');
  });

  it('keeps the title and the choices when the composer moves to another cell', () => {
    const { title } = setup(makeSpace(), { ...EMPTY_PRESETS, status: 'doing', assigneeIds: ['u1'] });
    type(title, 'Em andamento');
    act(() => useComposerStore.getState().setDraft({ points: 8 }));
    act(() => useComposerStore.getState().open('other', { ...EMPTY_PRESETS, status: 'to-do', assigneeIds: ['u2'] }));
    expect(useComposerStore.getState().draft).toMatchObject({ title: 'Em andamento', points: 8, assigneeIds: ['u2'] });
    expect(useComposerStore.getState().presets.status).toBe('to-do');
  });

  it('creates in another list of the same space from the list link, keeps the cell status, remembers the list and says where it went', async () => {
    const create = vi.spyOn(orbitService, 'createTask').mockResolvedValue(created({ listId: 'l2' }));
    const { title, page } = setup();
    expect(screen.getByRole('button', { name: /Create in Backlog/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Create in Backlog/ }));
    fireEvent.click(within(screen.getByRole('listbox', { name: 'List' })).getAllByRole('option', { name: 'Sprint 3' })[0]);
    expect(screen.getByRole('button', { name: /Create in Sprint 3/ })).toBeTruthy();
    type(title, 'Nova');
    submit();
    await waitFor(() => expect(create).toHaveBeenCalledWith('l2', { title: 'Nova', status: 'doing', tags: [], assigneeIds: [] }));
    expect(page().data.map((task) => task.id)).toEqual(['t1']);
    await waitFor(() => expect(useToastStore.getState().items.map((item) => item.values?.list)).toContain('Sprint 3'));
    expect(useRecentListsStore.getState().listIds[0]).toBe('l2');
    expect(screen.getByRole('button', { name: /Create in Sprint 3/ })).toBeTruthy();
  });

  it('follows the rules of the target space when the list is in another space, and drops the cell status there', async () => {
    const create = vi.spyOn(orbitService, 'createTask').mockResolvedValue(created({ listId: 'l9' }));
    const { title } = setup();
    fireEvent.click(screen.getByRole('button', { name: /Create in Backlog/ }));
    fireEvent.click(screen.getByRole('option', { name: 'Ideas' }));
    type(title, 'Nova');
    submit();
    expect(create).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toContain('[DS]');
    fireEvent.click(screen.getByRole('button', { name: '[DS]' }));
    submit();
    await waitFor(() => expect(create).toHaveBeenCalledWith('l9', { title: '[DS] Nova', tags: [], assigneeIds: [] }));
  });

  it('sets the priority with Ctrl+1 to Ctrl+4 and clears it with Ctrl+0 while typing', async () => {
    const create = vi.spyOn(orbitService, 'createTask').mockResolvedValue(created());
    const { title } = setup();
    type(title, 'Nova');
    fireEvent.keyDown(title, { key: '2', ctrlKey: true });
    expect(useComposerStore.getState().draft.priority).toBe('high');
    fireEvent.keyDown(title, { key: '0', ctrlKey: true });
    expect(useComposerStore.getState().draft.priority).toBeNull();
    fireEvent.keyDown(title, { key: '1', metaKey: true });
    expect(title.value).toBe('Nova');
    submit();
    await waitFor(() => expect(create.mock.calls[0][1]).toMatchObject({ priority: 'urgent' }));
  });

  it('takes a start and a due date from the shortcuts, closes the date picker after the due date and sends both', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-09T15:00:00'));
    const create = vi.spyOn(orbitService, 'createTask').mockResolvedValue(created());
    const { title } = setup();
    type(title, 'Nova');
    fireEvent.click(screen.getByRole('button', { name: 'Add dates' }));
    const picker = screen.getByRole('dialog', { name: 'Add dates' });
    const shortcuts = () => within(within(picker).getByRole('list', { name: 'Date shortcuts' }));
    fireEvent.click(within(picker).getByRole('button', { name: /^Start date/ }));
    fireEvent.click(shortcuts().getByRole('button', { name: /^Today/ }));
    expect(screen.getByRole('dialog', { name: 'Add dates' })).toBeTruthy();
    fireEvent.click(shortcuts().getByRole('button', { name: /^Next week(?!end)/ }));
    expect(screen.queryByRole('dialog', { name: 'Add dates' })).toBeNull();
    submit();
    await waitFor(() => expect(create).toHaveBeenCalled());
    expect(create.mock.calls[0][1].startDate?.slice(0, 10)).toBe('2026-11-09');
    expect(create.mock.calls[0][1].dueDate?.slice(0, 10)).toBe('2026-11-16');
    vi.useRealTimers();
  });

  it('lists me first in the assignee search and finds people by email', async () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Add assignee' }));
    const options = await screen.findAllByRole('option');
    expect(options[0].textContent).toContain('Ana Souza (me)');
    type(within(screen.getByRole('dialog', { name: 'Add assignee' })).getByRole('textbox') as HTMLInputElement, 'bruno@');
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([expect.stringContaining('Bruno Lima')]);
  });

  it('sends the task type chosen in the composer and nothing for a plain task', async () => {
    const create = vi.spyOn(orbitService, 'createTask').mockResolvedValue(created());
    const { title } = setup();
    type(title, 'Nova');
    fireEvent.click(screen.getByRole('button', { name: 'Task type' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Bug' }));
    submit();
    await waitFor(() => expect(create.mock.calls[0][1]).toMatchObject({ taskKind: 'bug' }));
    type(title, 'Outra');
    submit();
    await waitFor(() => expect(create).toHaveBeenCalledTimes(2));
    expect(create.mock.calls[1][1]).not.toHaveProperty('taskKind');
  });

  it('shows the list row with the status dot and the icon bar, and creates from a template with the typed title', async () => {
    vi.spyOn(workspaceService, 'templates').mockResolvedValue([{ id: 'tp1', spaceId: 's1', name: 'Bug report', titleTemplate: 'Bug: ', descriptionMd: '', tags: [], priority: null, taskKind: 'bug', estimateMinutes: null }]);
    const instantiate = vi.spyOn(workspaceService, 'instantiateTemplate').mockResolvedValue(created({ title: 'Login quebrado' }));
    const { title } = setup(makeSpace(), { ...EMPTY_PRESETS, status: 'doing' }, 'row');
    expect(screen.getByTestId('task-composer').getAttribute('data-variant')).toBe('row');
    for (const name of ['Task type', 'Templates', 'Assignees', 'Dates', 'Priority', 'Tags', 'Custom fields']) expect(screen.getByRole('button', { name })).toBeTruthy();
    type(title, 'Login quebrado');
    fireEvent.click(screen.getByRole('button', { name: 'Templates' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Bug report' }));
    await waitFor(() => expect(instantiate).toHaveBeenCalledWith('tp1', { listId: 'l1', title: 'Login quebrado' }));
    await waitFor(() => expect(useToastStore.getState().items.map((item) => item.messageKey)).toContain('taskCreatedIn'));
    expect(title.value).toBe('');
  });
});
