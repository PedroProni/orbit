// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { makeSpace, makeTask, MEMBERS, resetUiStore } from '../helpers/fixtures';
import { TaskComposer } from '@/components/tasks/task-composer';
import { EMPTY_PRESETS } from '@/components/tasks/task-composer.constants';
import { Toaster } from '@/components/ui/toaster';
import { ApiError } from '@/lib/api-client';
import { orbitService } from '@/services/orbit.service';
import { useComposerStore } from '@/stores/composer.store';
import { useToastStore } from '@/stores/toast.store';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

const submit = async (message: string, locale: 'en' | 'pt' = 'en') => {
  vi.spyOn(orbitService, 'createTask').mockRejectedValue(new ApiError(400, message));
  act(() => useComposerStore.getState().open('cell', EMPTY_PRESETS));
  renderWithProviders(
    <>
      <TaskComposer listId="l1" space={makeSpace()} label="add" />
      <Toaster />
    </>,
    locale,
  );
  const input = screen.getByTestId('task-composer').querySelector('textarea') as HTMLTextAreaElement;
  fireEvent.change(input, { target: { value: 'sem prefixo' } });
  fireEvent.submit(screen.getByTestId('task-composer'));
  return input;
};

describe('a refused create shows its rule', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetUiStore();
    useToastStore.setState({ items: [] });
    useComposerStore.getState().close();
    vi.spyOn(orbitService, 'members').mockResolvedValue(MEMBERS);
    vi.spyOn(orbitService, 'tasks').mockResolvedValue({ data: [makeTask()], total: 1 } as never);
  });

  it('shows the required prefixes in the composer and keeps what was typed', async () => {
    const input = await submit('Title must start with one of: [BUG], [FEAT]');
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('The title must start with [BUG], [FEAT]'));
    expect(input.value).toBe('sem prefixo');
    expect(useComposerStore.getState().anchor).toBe('cell');
  });

  it('shows the required tags in portuguese', async () => {
    await submit('At least one tag is required: p4t, bko', 'pt');
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('p4t, bko'));
  });

  it('reopens the composer with the draft and a toast when it was closed before the refusal', async () => {
    let refuse: (error: Error) => void = () => undefined;
    vi.spyOn(orbitService, 'createTask').mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          refuse = reject;
        }),
    );
    act(() => useComposerStore.getState().open('cell', EMPTY_PRESETS));
    renderWithProviders(
      <>
        <TaskComposer listId="l1" space={makeSpace()} label="add" />
        <Toaster />
      </>,
    );
    fireEvent.change(screen.getByTestId('task-composer').querySelector('textarea') as HTMLTextAreaElement, { target: { value: 'perdida' } });
    fireEvent.submit(screen.getByTestId('task-composer'));
    await waitFor(() => expect(orbitService.createTask).toHaveBeenCalled());
    act(() => useComposerStore.getState().close());
    await act(async () => refuse(new ApiError(400, 'At least one tag is required: p4t')));
    await waitFor(() => expect(useComposerStore.getState().anchor).toBe('cell'));
    expect(useComposerStore.getState().draft.title).toBe('perdida');
    expect(useComposerStore.getState().refusal?.key).toBe('tagError');
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('p4t'));
  });
});
