// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { MEMBERS, makeSpace, resetUiStore } from '../helpers/fixtures';
import { TaskToolbar } from '@/components/tasks/task-toolbar';
import { orbitService } from '@/services/orbit.service';
import { useComposerStore } from '@/stores/composer.store';
import { useCreateTaskStore } from '@/stores/create-task.store';
import { useUiStore } from '@/stores/ui.store';
import { useSessionStore } from '@/stores/session.store';

describe('TaskToolbar', () => {
  beforeEach(() => {
    useSessionStore.setState({ authenticated: true, hydrated: true });
    vi.restoreAllMocks();
    resetUiStore();
    useComposerStore.getState().close();
    useCreateTaskStore.setState({ open: false, session: 0, defaults: { listId: null } });
    vi.spyOn(orbitService, 'members').mockResolvedValue(MEMBERS);
    vi.spyOn(orbitService, 'savedViews').mockResolvedValue([]);
    vi.spyOn(orbitService, 'tasks').mockResolvedValue({ data: [], total: 0 } as never);
    vi.spyOn(orbitService, 'me').mockResolvedValue({ ...MEMBERS[0], workspaceId: 'w', scopes: [] } as never);
  });

  it('writes the search into the filters', () => {
    renderWithProviders(<TaskToolbar listId="l1" space={makeSpace()} readOnly={false} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Search in this list' }), { target: { value: 'login' } });
    expect(useUiStore.getState().filters.q).toBe('login');
  });

  it('sizes the search box to the whole placeholder in both languages, so it is never cut on phones', () => {
    const { unmount } = renderWithProviders(<TaskToolbar listId="l1" space={makeSpace()} readOnly={false} />, 'pt');
    const inList = screen.getByRole('textbox', { name: 'Buscar nesta lista' }) as HTMLInputElement;
    expect(inList.style.width).toBe(`${'Buscar nesta lista'.length + 2}ch`);
    expect(inList.className.split(' ')).not.toContain('w-28');
    unmount();
    renderWithProviders(<TaskToolbar listId={null} space={makeSpace()} readOnly={false} />);
    const all = screen.getByRole('textbox', { name: 'Search all tasks' }) as HTMLInputElement;
    expect(all.style.width).toBe(`${'Search all tasks'.length + 2}ch`);
    expect(all.className.split(' ')).toContain('max-w-full');
  });

  it('opens the full create form on this list from New task, on every view, without opening an inline composer', () => {
    const { unmount } = renderWithProviders(<TaskToolbar listId="l1" space={makeSpace({ requiredTags: ['P4T'] })} readOnly={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'New task' }));
    expect(useCreateTaskStore.getState()).toMatchObject({ open: true, session: 1, defaults: { listId: 'l1' } });
    expect(useComposerStore.getState().anchor).toBeNull();
    expect(screen.queryByTestId('task-composer')).toBeNull();
    unmount();
    useUiStore.setState({ view: 'calendar' });
    renderWithProviders(<TaskToolbar listId="l2" space={makeSpace()} readOnly={false} />);
    expect(screen.queryByRole('button', { name: 'Display' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'New task' }));
    expect(useCreateTaskStore.getState()).toMatchObject({ session: 2, defaults: { listId: 'l2' } });
  });

  it('shows display on the list and the board', () => {
    renderWithProviders(<TaskToolbar listId="l1" space={makeSpace()} readOnly={false} />);
    expect(screen.getByRole('button', { name: 'Display' })).toBeTruthy();
  });

  it('has no new task for a guest or before the space arrives', () => {
    const { unmount } = renderWithProviders(<TaskToolbar listId="l1" space={makeSpace()} readOnly />);
    expect(screen.queryByRole('button', { name: 'New task' })).toBeNull();
    unmount();
    renderWithProviders(<TaskToolbar listId="l1" readOnly={false} />);
    expect(screen.queryByRole('button', { name: 'New task' })).toBeNull();
  });
});
