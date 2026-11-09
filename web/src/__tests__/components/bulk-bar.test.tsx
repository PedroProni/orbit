// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { chooseOption } from '../helpers/choose-option';
import { MEMBERS, makeSpace, makeTask } from '../helpers/fixtures';
import { BulkBar } from '@/components/tasks/bulk-bar';
import { orbitService } from '@/services/orbit.service';
import { useSelectionStore } from '@/stores/selection.store';
import { useToastStore } from '@/stores/toast.store';
import { useSessionStore } from '@/stores/session.store';

const space = makeSpace();

describe('BulkBar', () => {
  beforeEach(() => {
    useSessionStore.setState({ authenticated: true, hydrated: true });
    vi.restoreAllMocks();
    useToastStore.setState({ items: [] });
    useSelectionStore.getState().set(['a', 'b']);
    vi.spyOn(orbitService, 'members').mockResolvedValue(MEMBERS);
    vi.spyOn(orbitService, 'me').mockResolvedValue({ ...MEMBERS[0], workspaceId: 'w', scopes: [] } as never);
  });

  it('renders nothing with no selection', () => {
    useSelectionStore.getState().clear();
    renderWithProviders(<BulkBar space={space} />);
    expect(screen.queryByRole('toolbar')).toBeNull();
  });

  it('shows the count and clears the selection', () => {
    renderWithProviders(<BulkBar space={space} />);
    expect(screen.getByText('2 selected')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(useSelectionStore.getState().ids).toEqual([]);
  });

  it.each([
    ['Status', 'doing', { status: 'doing' }],
    ['Priority', 'Urgent', { priority: 'urgent' }],
  ])('applies %s to every selected task and clears them', async (label, option, patch) => {
    const update = vi.spyOn(orbitService, 'updateTask').mockResolvedValue(makeTask());
    renderWithProviders(<BulkBar space={space} />);
    chooseOption(screen.getByRole('combobox', { name: label }), option);
    await waitFor(() => expect(useSelectionStore.getState().ids).toEqual([]));
    expect(update.mock.calls.map((call) => call[0]).sort()).toEqual(['a', 'b']);
    expect(update.mock.calls[0][1]).toEqual(patch);
    expect(useToastStore.getState().items.map((item) => item.messageKey)).toContain('bulkDone');
  });

  it('adds an assignee without replacing the others', async () => {
    const update = vi.spyOn(orbitService, 'updateTask').mockResolvedValue(makeTask());
    renderWithProviders(<BulkBar space={space} />);
    const trigger = await screen.findByRole('combobox', { name: 'Assign' });
    await waitFor(() => expect(orbitService.members).toHaveBeenCalled());
    fireEvent.click(trigger);
    fireEvent.click(await screen.findByRole('option', { name: 'Bruno Lima' }));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(2));
    expect(update.mock.calls[0][1]).toEqual({ addAssigneeIds: ['u2'] });
  });

  it('adds a lowercased tag, and ignores a blank one', async () => {
    const update = vi.spyOn(orbitService, 'updateTask').mockResolvedValue(makeTask());
    renderWithProviders(<BulkBar space={space} />);
    const input = screen.getByLabelText('Add tag') as HTMLInputElement;
    fireEvent.submit(input.closest('form') as HTMLFormElement);
    expect(update).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: ' NOVA ' } });
    fireEvent.submit(input.closest('form') as HTMLFormElement);
    await waitFor(() => expect(update).toHaveBeenCalledTimes(2));
    expect(update.mock.calls[0][1]).toEqual({ addTags: ['nova'] });
    expect(input.value).toBe('');
  });

  it('archives the selection', async () => {
    const update = vi.spyOn(orbitService, 'updateTask').mockResolvedValue(makeTask());
    renderWithProviders(<BulkBar space={space} />);
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(2));
    expect(update.mock.calls[0][1]).toEqual({ archived: true });
  });

  it('keeps the refused tasks selected and reports both counts', async () => {
    vi.spyOn(orbitService, 'updateTask').mockImplementation(async (id) => {
      if (id === 'b') throw new Error('403');
      return makeTask();
    });
    renderWithProviders(<BulkBar space={space} />);
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));
    await waitFor(() => expect(useSelectionStore.getState().ids).toEqual(['b']));
    const toast = useToastStore.getState().items.find((item) => item.messageKey === 'bulkPartial');
    expect(toast?.values).toEqual({ done: '1', failed: '1' });
  });
});
