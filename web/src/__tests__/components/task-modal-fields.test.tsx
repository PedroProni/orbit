// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { chooseOption } from '../helpers/choose-option';
import { MEMBERS, makeTask } from '../helpers/fixtures';
import { TaskChecklists } from '@/components/tasks/task-checklists';
import { TaskCustomFieldRows } from '@/components/tasks/task-custom-fields';
import { TaskFieldsSection } from '@/components/tasks/task-fields-section';
import { customFieldDay, fieldsForTask, withCustomFieldValue } from '@/components/tasks/task-custom-fields.helpers';
import { TaskPeopleField } from '@/components/tasks/task-people-field';
import { TaskPointsField } from '@/components/tasks/task-points-field';
import { TaskSubtasks } from '@/components/tasks/task-subtasks';
import { TaskTagsField } from '@/components/tasks/task-tags-field';
import { ApiError } from '@/lib/api-client';
import { orbitService } from '@/services/orbit.service';
import { CustomFieldDefinition, Principal } from '@/types/api.types';
import { useSessionStore } from '@/stores/session.store';

const member = { ...MEMBERS[1], workspaceId: 'w', scopes: [] } as Principal;
const people = MEMBERS.map((m) => ({ id: m.id, name: m.name }));

describe('TaskPeopleField', () => {
  it('shows the chosen names and toggles a person from the picker', () => {
    const onToggle = vi.fn();
    renderWithProviders(<TaskPeopleField label="Watchers" emptyLabel="Nobody" people={people} selected={['u1']} onToggle={onToggle} />);
    expect(screen.getByRole('button', { name: 'Watchers' }).textContent).toContain('Ana Souza');
    fireEvent.click(screen.getByRole('button', { name: 'Watchers' }));
    expect(screen.getByRole('option', { name: /Ana Souza/ }).getAttribute('aria-selected')).toBe('true');
    fireEvent.click(screen.getByRole('option', { name: /Bruno Lima/ }));
    expect(onToggle).toHaveBeenCalledWith('u2');
  });

  it('shows the empty label', () => {
    renderWithProviders(<TaskPeopleField label="Watchers" emptyLabel="Nobody" people={people} selected={[]} onToggle={vi.fn()} />);
    expect(screen.getByText('Nobody')).toBeTruthy();
  });
});

describe('TaskTagsField', () => {
  it('removes a tag and adds another, typed or suggested', () => {
    const onAdd = vi.fn();
    const onRemove = vi.fn();
    renderWithProviders(<TaskTagsField tags={['a']} suggestions={['b']} readOnly={false} onAdd={onAdd} onRemove={onRemove} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove tag a' }));
    expect(onRemove).toHaveBeenCalledWith('a');
    fireEvent.click(screen.getByRole('button', { name: 'Add tag' }));
    fireEvent.click(screen.getByRole('option', { name: 'b' }));
    expect(onAdd).toHaveBeenCalledWith('b');
    const input = within(screen.getByRole('dialog', { name: 'Tags' })).getByRole('textbox');
    fireEvent.change(input, { target: { value: 'NOVA' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onAdd).toHaveBeenCalledWith('nova');
  });

  it('keeps the row compact: an icon add after the chips, and a muted Empty with no tags', () => {
    const { unmount } = renderWithProviders(<TaskTagsField tags={['devops', 'infra']} suggestions={[]} readOnly={false} onAdd={vi.fn()} onRemove={vi.fn()} />);
    const add = screen.getByRole('button', { name: 'Add tag' });
    expect(add.textContent).toBe('');
    expect(add.querySelector('svg')).toBeTruthy();
    const remove = screen.getByRole('button', { name: 'Remove tag devops' });
    expect(remove.className.split(' ')).toEqual(expect.arrayContaining(['opacity-0', 'w-0', 'ml-0', 'overflow-hidden', 'group-hover:w-[11px]', 'focus-visible:w-[11px]']));
    expect((remove.parentElement as HTMLElement).className.split(' ')).not.toContain('gap-1');
    unmount();
    renderWithProviders(<TaskTagsField tags={[]} suggestions={[]} readOnly={false} onAdd={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Add tag' }).textContent).toBe('Empty');
  });

  it('is read only for a guest, and hidden with no tags', () => {
    const { unmount } = renderWithProviders(<TaskTagsField tags={['a']} suggestions={[]} readOnly onAdd={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByText('a')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
    unmount();
    renderWithProviders(<TaskTagsField tags={[]} suggestions={[]} readOnly onAdd={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.queryByRole('group')).toBeNull();
  });
});

describe('TaskPointsField', () => {
  const field = (value: number | null, readOnly = false) => {
    const onSave = vi.fn();
    renderWithProviders(<TaskPointsField value={value} readOnly={readOnly} onSave={onSave} />);
    return { onSave, input: screen.getByLabelText('Points') as HTMLInputElement };
  };

  it('saves a new value on blur, and zero is a value', () => {
    const { onSave, input } = field(null);
    fireEvent.change(input, { target: { value: '0' } });
    fireEvent.blur(input);
    expect(onSave).toHaveBeenCalledWith(0);
  });

  it('clears with an empty field', () => {
    const { onSave, input } = field(5);
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);
    expect(onSave).toHaveBeenCalledWith(null);
  });

  it('does not save the same value, and puts back a negative one', () => {
    const { onSave, input } = field(5);
    fireEvent.blur(input);
    fireEvent.change(input, { target: { value: '-1' } });
    fireEvent.blur(input);
    expect(onSave).not.toHaveBeenCalled();
    expect(input.value).toBe('5');
  });

  it('is disabled for a guest', () => {
    expect(field(5, true).input.disabled).toBe(true);
  });
});

describe('TaskCustomFieldRows', () => {
  const definitions: CustomFieldDefinition[] = [
    {
      id: 'f1',
      spaceId: 's1',
      name: 'Area',
      type: 'dropdown',
      options: [
        { id: 'o1', label: 'Back', color: '#111111' },
        { id: 'o2', label: 'Front', color: '#222222' },
      ],
      listIds: null,
    },
    { id: 'f2', spaceId: 's1', name: 'Link', type: 'url', options: [], listIds: null },
    { id: 'f3', spaceId: 's1', name: 'Entrega', type: 'date', options: [], listIds: null },
  ];
  const stub = (role = 'member') => {
    vi.spyOn(orbitService, 'me').mockResolvedValue({ ...member, role } as Principal);
    return vi.spyOn(orbitService, 'customFields').mockResolvedValue(definitions);
  };

  beforeEach(() => {
    useSessionStore.setState({ authenticated: true, hydrated: true });
    vi.restoreAllMocks();
    useSessionStore.setState({ authenticated: true, hydrated: true });
  });

  it('saves the option id of a dropdown, keeping the other values', async () => {
    stub();
    const save = vi.fn();
    renderWithProviders(
      <ul>
        <TaskCustomFieldRows task={makeTask({ customFields: [{ fieldId: 'f2', value: 'https://a.io' }] })} save={save} />
      </ul>,
    );
    chooseOption(await screen.findByRole('combobox', { name: 'Area' }), 'Front');
    expect(save).toHaveBeenCalledWith({
      customFields: [
        { fieldId: 'f2', value: 'https://a.io' },
        { fieldId: 'f1', value: 'o2' },
      ],
    });
  });

  it('clears a value by removing it from the array', async () => {
    stub();
    const save = vi.fn();
    renderWithProviders(
      <ul>
        <TaskCustomFieldRows task={makeTask({ customFields: [{ fieldId: 'f1', value: 'o1' }] })} save={save} />
      </ul>,
    );
    chooseOption(await screen.findByRole('combobox', { name: 'Area' }), '-');
    expect(save).toHaveBeenCalledWith({ customFields: [] });
  });

  it('saves a url on blur only when it changed, and links only to a valid one', async () => {
    stub();
    const save = vi.fn();
    renderWithProviders(
      <ul>
        <TaskCustomFieldRows task={makeTask({ customFields: [{ fieldId: 'f2', value: 'https://a.io' }] })} save={save} />
      </ul>,
    );
    const input = (await screen.findByRole('textbox', { name: 'Link' })) as HTMLInputElement;
    expect(screen.getByRole('link', { name: 'Open Link' }).getAttribute('rel')).toContain('noopener');
    fireEvent.blur(input);
    expect(save).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: ' https://b.io ' } });
    fireEvent.blur(input);
    expect(save).toHaveBeenCalledWith({ customFields: [{ fieldId: 'f2', value: 'https://b.io' }] });
  });

  it('never links to a value that is not http, like a script url', async () => {
    stub();
    renderWithProviders(
      <ul>
        <TaskCustomFieldRows task={makeTask({ customFields: [{ fieldId: 'f2', value: 'javascript:alert(1)' }] })} save={vi.fn()} />
      </ul>,
    );
    await screen.findByRole('textbox', { name: 'Link' });
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('asks nothing for a guest, who sees only the fixed slots, read only', async () => {
    const list = stub('guest');
    vi.spyOn(orbitService, 'pullRequests').mockResolvedValue([]);
    vi.spyOn(orbitService, 'prints').mockResolvedValue([]);
    renderWithProviders(<TaskFieldsSection task={makeTask()} readOnly save={vi.fn()} />);
    await waitFor(() => expect(orbitService.pullRequests).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(list).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Fields' })).toBeTruthy();
    expect(screen.queryByRole('combobox', { name: 'Area' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Add Figma' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Link PR' })).toBeNull();
  });

  it('folds the Fields section and keeps all empty fields behind a toggle', async () => {
    stub();
    vi.spyOn(orbitService, 'pullRequests').mockResolvedValue([]);
    vi.spyOn(orbitService, 'prints').mockResolvedValue([]);
    renderWithProviders(<TaskFieldsSection task={makeTask({ customFields: [] })} readOnly={false} save={vi.fn()} />);
    const toggle = screen.getByRole('button', { name: 'Fields' });
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(await screen.findByRole('button', { name: 'Show 3 empty fields' }));
    expect(screen.getByRole('combobox', { name: 'Area' }).textContent).toContain('-');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('combobox', { name: 'Area' })).toBeNull();
  });

  it('keeps a field of another list out, unless the task already has a value for it', () => {
    const scoped: CustomFieldDefinition[] = [
      { id: 'a', spaceId: 's1', name: 'All', type: 'url', options: [], listIds: null },
      { id: 'b', spaceId: 's1', name: 'Mine', type: 'url', options: [], listIds: ['l1'] },
      { id: 'c', spaceId: 's1', name: 'Other', type: 'url', options: [], listIds: ['l9'] },
      { id: 'd', spaceId: 's1', name: 'Kept', type: 'url', options: [], listIds: ['l9'] },
    ];
    const task = makeTask({ listId: 'l1', customFields: [{ fieldId: 'd', value: 'https://a.io' }] });
    expect(fieldsForTask(scoped, task).map((field) => field.id)).toEqual(['a', 'b', 'd']);
  });

  it('hides empty fields by default when there are more than six, and shows them on demand', async () => {
    vi.spyOn(orbitService, 'me').mockResolvedValue(member);
    const many: CustomFieldDefinition[] = Array.from({ length: 7 }, (_, index) => ({ id: `m${index}`, spaceId: 's1', name: `Campo ${index}`, type: 'url', options: [], listIds: null }));
    vi.spyOn(orbitService, 'customFields').mockResolvedValue(many);
    renderWithProviders(
      <ul>
        <TaskCustomFieldRows task={makeTask({ customFields: [{ fieldId: 'm3', value: 'https://a.io' }] })} save={vi.fn()} />
      </ul>,
    );
    expect(await screen.findByRole('textbox', { name: 'Campo 3' })).toBeTruthy();
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Show 6 empty fields' }));
    expect(screen.getAllByRole('textbox')).toHaveLength(7);
    fireEvent.click(screen.getByRole('button', { name: 'Hide empty fields' }));
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
  });

  it('replaces only its own value and reads dates in any stored form', () => {
    expect(
      withCustomFieldValue(
        [
          { fieldId: 'a', value: 1 },
          { fieldId: 'b', value: 2 },
        ],
        'a',
        '9',
      ),
    ).toEqual([
      { fieldId: 'b', value: 2 },
      { fieldId: 'a', value: '9' },
    ]);
    expect(withCustomFieldValue([{ fieldId: 'a', value: 1 }], 'a', null)).toEqual([]);
    expect(customFieldDay('2026-03-04T12:00:00.000Z')).toBe('2026-03-04');
    expect(customFieldDay(Date.UTC(2026, 2, 4, 12))).toBe('2026-03-04');
    expect(customFieldDay('lixo')).toBe('');
    expect(customFieldDay(null)).toBe('');
  });
});

describe('TaskChecklists', () => {
  const list = {
    id: 'c1',
    name: 'QA',
    items: [
      { id: 'i1', name: 'Um', resolved: false, assigneeId: 'u1' },
      { id: 'i2', name: 'Dois', resolved: true, assigneeId: null },
    ],
  };
  const other = { id: 'c2', name: 'Outra', items: [] };
  const task = makeTask({ checklists: [list, other] });
  const sent = (save: ReturnType<typeof vi.fn>) => save.mock.calls[0][0].checklists;

  it('marks an item and sends the whole array, keeping everything else', () => {
    const save = vi.fn();
    renderWithProviders(<TaskChecklists task={task} readOnly={false} save={save} adding={false} onAddingChange={vi.fn()} />);
    expect(screen.getByText('1/2')).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Mark Um as done' }));
    expect(sent(save)).toEqual([{ ...list, items: [{ ...list.items[0], resolved: true }, list.items[1]] }, other]);
  });

  it('adds an item, trimmed, and ignores a blank one', () => {
    const save = vi.fn();
    renderWithProviders(<TaskChecklists task={task} readOnly={false} save={save} adding={false} onAddingChange={vi.fn()} />);
    const input = screen.getByRole('textbox', { name: 'Add item to QA' }) as HTMLInputElement;
    fireEvent.submit(input.closest('form') as HTMLFormElement);
    expect(save).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: ' Tres ' } });
    fireEvent.submit(input.closest('form') as HTMLFormElement);
    const added = sent(save)[0].items[2];
    expect(added).toMatchObject({ name: 'Tres', resolved: false, assigneeId: null });
    expect(added.id).toBeTruthy();
    expect(input.value).toBe('');
  });

  it('renames an item and a checklist on blur, and puts back a blank name', () => {
    const save = vi.fn();
    renderWithProviders(<TaskChecklists task={task} readOnly={false} save={save} adding={false} onAddingChange={vi.fn()} />);
    const item = screen.getByRole('textbox', { name: 'Rename item Um' }) as HTMLInputElement;
    fireEvent.change(item, { target: { value: '  ' } });
    fireEvent.blur(item);
    expect(save).not.toHaveBeenCalled();
    expect(item.value).toBe('Um');
    fireEvent.change(item, { target: { value: 'Novo' } });
    fireEvent.blur(item);
    expect(sent(save)[0].items[0].name).toBe('Novo');
    save.mockClear();
    const name = screen.getByRole('textbox', { name: 'Rename checklist QA' });
    fireEvent.change(name, { target: { value: 'Testes' } });
    fireEvent.blur(name);
    expect(sent(save)[0].name).toBe('Testes');
  });

  it('deletes an item and a checklist', () => {
    const save = vi.fn();
    renderWithProviders(<TaskChecklists task={task} readOnly={false} save={save} adding={false} onAddingChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete item Dois' }));
    expect(sent(save)[0].items.map((i: { id: string }) => i.id)).toEqual(['i1']);
    save.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Delete checklist QA' }));
    expect(sent(save)).toEqual([other]);
  });

  it('adds a checklist', () => {
    const save = vi.fn();
    const onAddingChange = vi.fn();
    const { rerender } = renderWithProviders(<TaskChecklists task={task} readOnly={false} save={save} adding={false} onAddingChange={onAddingChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add checklist' }));
    expect(onAddingChange).toHaveBeenLastCalledWith(true);
    rerender(<TaskChecklists task={task} readOnly={false} save={save} adding onAddingChange={onAddingChange} />);
    const input = screen.getByRole('textbox', { name: 'Checklist name' });
    fireEvent.change(input, { target: { value: 'Nova' } });
    fireEvent.submit(input.closest('form') as HTMLFormElement);
    expect(sent(save)[2]).toMatchObject({ name: 'Nova', items: [] });
    expect(onAddingChange).toHaveBeenLastCalledWith(false);
  });

  it('shows nothing for a task without checklists until one is being created, and drops a blank one on blur', () => {
    const onAddingChange = vi.fn();
    const bare = makeTask({ checklists: [] });
    const { container, rerender } = renderWithProviders(<TaskChecklists task={bare} readOnly={false} save={vi.fn()} adding={false} onAddingChange={onAddingChange} />);
    expect(container.textContent).toBe('');
    rerender(<TaskChecklists task={bare} readOnly={false} save={vi.fn()} adding onAddingChange={onAddingChange} />);
    const input = screen.getByRole('textbox', { name: 'Checklist name' });
    expect(document.activeElement).toBe(input);
    fireEvent.blur(input);
    expect(onAddingChange).toHaveBeenLastCalledWith(false);
  });

  it('gives a guest a plain list, with no way to change it', () => {
    renderWithProviders(<TaskChecklists task={task} readOnly save={vi.fn()} adding={false} onAddingChange={vi.fn()} />);
    expect(screen.getByText('Um')).toBeTruthy();
    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('TaskSubtasks', () => {
  const subtask = makeTask({ id: 'sub', title: 'Filha', parentId: 't1' });

  beforeEach(() => {
    useSessionStore.setState({ authenticated: true, hydrated: true });
    vi.restoreAllMocks();
    vi.spyOn(orbitService, 'subtasks').mockResolvedValue({ data: [subtask], total: 1 } as never);
  });

  it('creates a subtask under the parent and clears the field', async () => {
    const create = vi.spyOn(orbitService, 'createTask').mockResolvedValue(subtask);
    renderWithProviders(<TaskSubtasks parentId="t1" listId="l1" canAdd composing onComposingChange={vi.fn()} />);
    const input = screen.getByRole('textbox', { name: 'Add subtask' }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: ' Filha ' } });
    fireEvent.submit(input.closest('form') as HTMLFormElement);
    await waitFor(() => expect(create).toHaveBeenCalledWith('l1', { title: 'Filha', parentId: 't1' }));
    await waitFor(() => expect(input.value).toBe(''));
  });

  it('shows the refusal in place and keeps the text', async () => {
    vi.spyOn(orbitService, 'createTask').mockRejectedValue(new ApiError(403, 'Forbidden'));
    renderWithProviders(<TaskSubtasks parentId="t1" listId="l1" canAdd composing onComposingChange={vi.fn()} />);
    const input = screen.getByRole('textbox', { name: 'Add subtask' }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Filha' } });
    fireEvent.submit(input.closest('form') as HTMLFormElement);
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(input.value).toBe('Filha');
  });

  it('has no add field for a guest or on a subtask, and hides when empty', async () => {
    const { unmount } = renderWithProviders(<TaskSubtasks parentId="t1" listId="l1" canAdd={false} composing={false} onComposingChange={vi.fn()} />);
    expect(await screen.findByText(/Filha/)).toBeTruthy();
    expect(screen.queryByRole('textbox')).toBeNull();
    unmount();
    vi.spyOn(orbitService, 'subtasks').mockResolvedValue({ data: [], total: 0 } as never);
    renderWithProviders(<TaskSubtasks parentId="t2" listId="l1" canAdd={false} composing onComposingChange={vi.fn()} />);
    await waitFor(() => expect(orbitService.subtasks).toHaveBeenCalled());
    expect(screen.queryByText('Subtasks')).toBeNull();
  });

  it('stays hidden on a task without subtasks until asked to compose, and stops composing on an empty blur', async () => {
    vi.spyOn(orbitService, 'subtasks').mockResolvedValue({ data: [], total: 0 } as never);
    const onComposingChange = vi.fn();
    const { container, rerender } = renderWithProviders(<TaskSubtasks parentId="t3" listId="l1" canAdd composing={false} onComposingChange={onComposingChange} />);
    await waitFor(() => expect(orbitService.subtasks).toHaveBeenCalled());
    expect(container.textContent).toBe('');
    rerender(<TaskSubtasks parentId="t3" listId="l1" canAdd composing onComposingChange={onComposingChange} />);
    const input = screen.getByRole('textbox', { name: 'Add subtask' });
    expect(document.activeElement).toBe(input);
    fireEvent.blur(input);
    expect(onComposingChange).toHaveBeenCalledWith(false);
  });
});
