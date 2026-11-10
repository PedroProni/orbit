// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { MEMBERS, makeSpace, makeTask, resetUiStore } from '../helpers/fixtures';
import { KanbanBoard } from '@/components/tasks/kanban-board';
import { useUiStore } from '@/stores/ui.store';

vi.mock('@/hooks/use-orbit', () => ({
  useMembers: () => ({ data: MEMBERS }),
  useUpdateTask: () => ({ mutate: vi.fn() }),
  useTasks: () => ({ data: { data: [] } }),
  useHierarchy: () => ({ data: undefined }),
  useMe: () => ({ data: MEMBERS[0] }),
}));

const space = makeSpace();
const task = makeTask({ id: 'a', title: 'Ship release' });
const card = () => document.querySelector<HTMLElement>('[data-task-card="a"]') as HTMLElement;
const lifted = () => card().className.includes('opacity-40');
const point = (x: number, y: number) => ({ clientX: x, clientY: y, pageX: x, pageY: y, screenX: x, screenY: y, identifier: 1, target: card() });

describe('board drag on touch screens', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetUiStore();
    renderWithProviders(<KanbanBoard tasks={[task]} space={space} listId="l1" />);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps the card free of text selection, the long press callout and browser gestures other than panning', () => {
    const classes = card().className.split(/\s+/);
    expect(classes).toContain('select-none');
    expect(classes).toContain('[-webkit-touch-callout:none]');
    expect(classes).toContain('touch-manipulation');
  });

  it('does not start a drag when a finger moves the card without holding it first', () => {
    fireEvent.pointerDown(card(), { pointerType: 'touch', isPrimary: true, button: 0, clientX: 20, clientY: 20 });
    fireEvent.pointerMove(card(), { pointerType: 'touch', isPrimary: true, clientX: 40, clientY: 20 });
    fireEvent.pointerMove(card(), { pointerType: 'touch', isPrimary: true, clientX: 80, clientY: 20 });
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(lifted()).toBe(false);
  });

  it('starts the drag only after the finger holds still for about 250 ms', () => {
    fireEvent.touchStart(card(), { touches: [point(20, 20)], changedTouches: [point(20, 20)] });
    act(() => {
      vi.advanceTimersByTime(230);
    });
    expect(lifted()).toBe(false);
    act(() => {
      vi.advanceTimersByTime(40);
    });
    expect(lifted()).toBe(true);
  });

  it('gives up the hold when the finger slides more than 6 px, so the swipe scrolls the board instead', () => {
    fireEvent.touchStart(card(), { touches: [point(20, 20)], changedTouches: [point(20, 20)] });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    fireEvent.touchMove(card(), { touches: [point(28, 20)], changedTouches: [point(28, 20)] });
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(lifted()).toBe(false);
  });

  it('still starts the drag with the mouse after 6 px, with no hold', () => {
    fireEvent.pointerDown(card(), { pointerType: 'mouse', isPrimary: true, button: 0, clientX: 20, clientY: 20 });
    fireEvent.pointerMove(document, { pointerType: 'mouse', isPrimary: true, clientX: 30, clientY: 20 });
    expect(lifted()).toBe(true);
    fireEvent.pointerUp(document, { pointerType: 'mouse', isPrimary: true, clientX: 30, clientY: 20 });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(lifted()).toBe(false);
  });

  it('opens the task on a quick tap', () => {
    fireEvent.touchStart(card(), { touches: [point(20, 20)], changedTouches: [point(20, 20)] });
    fireEvent.touchEnd(card(), { touches: [], changedTouches: [point(20, 20)] });
    fireEvent.click(screen.getByText('Ship release'));
    expect(lifted()).toBe(false);
    expect(useUiStore.getState().openTaskId).toBe('a');
  });
});
