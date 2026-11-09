// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { resetUiStore } from '../helpers/fixtures';
import { useShortcuts } from '@/hooks/use-shortcuts';
import { useUiStore } from '@/stores/ui.store';
import { useCreateTaskStore } from '@/stores/create-task.store';

const newTask = vi.fn();

function Harness({ canCreate = true, withButton = true }: { canCreate?: boolean; withButton?: boolean }) {
  useShortcuts(canCreate);
  return (
    <div>
      <input data-shortcut="search" aria-label="s" />
      {withButton ? <button type="button" data-shortcut="new-task" aria-label="n" onClick={newTask} /> : null}
      <textarea aria-label="typing" />
      <button type="button" role="combobox" aria-controls="x" aria-expanded="false" aria-label="widget" />
    </div>
  );
}

describe('useShortcuts', () => {
  beforeEach(() => {
    resetUiStore();
    useUiStore.setState({ paletteOpen: false });
  });

  it('toggles the palette with Ctrl+K and Cmd+K', () => {
    render(<Harness />);
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(useUiStore.getState().paletteOpen).toBe(true);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(useUiStore.getState().paletteOpen).toBe(false);
  });

  it('focuses search with / and starts a new task with c', () => {
    const { getByLabelText } = render(<Harness />);
    fireEvent.keyDown(window, { key: '/' });
    expect(document.activeElement).toBe(getByLabelText('s'));
    (document.activeElement as HTMLElement).blur();
    newTask.mockClear();
    fireEvent.keyDown(window, { key: 'c' });
    expect(newTask).toHaveBeenCalledTimes(1);
  });

  it('opens the create form with c when the page has no New task button, and never for a guest', () => {
    useCreateTaskStore.setState({ open: false, session: 0, defaults: { listId: 'x' } });
    const { unmount } = render(<Harness withButton={false} />);
    fireEvent.keyDown(window, { key: 'c' });
    expect(useCreateTaskStore.getState()).toMatchObject({ open: true, session: 1, defaults: { listId: null } });
    unmount();
    useCreateTaskStore.setState({ open: false, session: 0, defaults: { listId: null } });
    newTask.mockClear();
    render(<Harness canCreate={false} />);
    fireEvent.keyDown(window, { key: 'c' });
    expect(newTask).not.toHaveBeenCalled();
    expect(useCreateTaskStore.getState().open).toBe(false);
  });

  it('leaves letters to the Select that has focus', () => {
    const { getByLabelText } = render(<Harness />);
    const widget = getByLabelText('widget');
    widget.focus();
    fireEvent.keyDown(widget, { key: 'c' });
    expect(document.activeElement).toBe(widget);
  });

  it('switches views with the g chord and ignores keys while typing', () => {
    const { getByLabelText } = render(<Harness />);
    fireEvent.keyDown(window, { key: 'g' });
    fireEvent.keyDown(window, { key: 'b' });
    expect(useUiStore.getState().view).toBe('board');
    fireEvent.keyDown(getByLabelText('typing'), { key: 'g' });
    fireEvent.keyDown(getByLabelText('typing'), { key: 'l' });
    expect(useUiStore.getState().view).toBe('board');
  });
});
