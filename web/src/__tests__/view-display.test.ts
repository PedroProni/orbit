// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bulkUpdate } from '@/lib/bulk-update';
import { BULK_CONCURRENCY } from '@/lib/bulk-update.constants';
import { loadViewDisplay, saveViewDisplay } from '@/lib/view-display-storage';
import { displayOf, viewIsDirty } from '@/components/tasks/view-state.helpers';
import { DEFAULT_DISPLAY, EMPTY_FILTERS } from '@/stores/ui.constants';
import { useComposerStore } from '@/stores/composer.store';
import { useSelectionStore } from '@/stores/selection.store';
import { useUiStore } from '@/stores/ui.store';
import { EMPTY_PRESETS } from '@/components/tasks/task-composer.constants';
import { SavedView } from '@/types/api.types';

const saved = (over: Partial<SavedView> = {}): SavedView => ({ id: 'v', ownerId: 'u', name: 'n', viewType: 'board', listId: 'l', filters: EMPTY_FILTERS, shared: false, display: null, ...over });

describe('view display storage', () => {
  beforeEach(() => window.localStorage.clear());

  it('returns the default for a list with nothing saved or a broken value', () => {
    expect(loadViewDisplay('l1')).toEqual(DEFAULT_DISPLAY);
    window.localStorage.setItem('orbit.display.l1', '{broken');
    expect(loadViewDisplay('l1')).toEqual(DEFAULT_DISPLAY);
  });

  it('keeps one display per list and fills in new fields', () => {
    saveViewDisplay('l1', { ...DEFAULT_DISPLAY, groupBy: 'tag' });
    expect(loadViewDisplay('l1').groupBy).toBe('tag');
    expect(loadViewDisplay('l2').groupBy).toBe('status');
    window.localStorage.setItem('orbit.display.l3', JSON.stringify({ hideEmpty: true }));
    expect(loadViewDisplay('l3')).toEqual({ ...DEFAULT_DISPLAY, hideEmpty: true });
  });
});

describe('view state', () => {
  it('uses the default display for a view saved without one', () => {
    expect(displayOf(saved())).toEqual(DEFAULT_DISPLAY);
    expect(displayOf(saved({ display: { ...DEFAULT_DISPLAY, swimlane: 'priority' } })).swimlane).toBe('priority');
  });

  it('is clean when nothing changed, ignoring the order of lists', () => {
    const view = saved({ filters: { ...EMPTY_FILTERS, tags: ['a', 'b'] }, display: { ...DEFAULT_DISPLAY, cardFields: ['tags', 'points'] } });
    expect(viewIsDirty(view, 'board', { ...EMPTY_FILTERS, tags: ['b', 'a'] }, { ...DEFAULT_DISPLAY, cardFields: ['points', 'tags'] })).toBe(false);
  });

  it.each([
    ['the view type', 'list', EMPTY_FILTERS, DEFAULT_DISPLAY],
    ['a filter', 'board', { ...EMPTY_FILTERS, q: 'x' }, DEFAULT_DISPLAY],
    ['show closed', 'board', { ...EMPTY_FILTERS, includeClosed: false }, DEFAULT_DISPLAY],
    ['the display', 'board', EMPTY_FILTERS, { ...DEFAULT_DISPLAY, hideEmpty: true }],
    ['a limit', 'board', EMPTY_FILTERS, { ...DEFAULT_DISPLAY, wipLimits: [{ column: 'a', limit: 1 }] }],
  ])('is dirty when %s changes', (_name, view, filters, display) => {
    expect(viewIsDirty(saved(), view as never, filters, display)).toBe(true);
  });
});

describe('bulkUpdate', () => {
  it('returns the ids that failed and tries them all', async () => {
    const update = vi.fn(async (id: string) => {
      if (id === 'b' || id === 'd') throw new Error('no');
      return {} as never;
    });
    expect((await bulkUpdate(['a', 'b', 'c', 'd', 'e'], { archived: true }, update)).sort()).toEqual(['b', 'd']);
    expect(update).toHaveBeenCalledTimes(5);
  });

  it('never runs more than the limit at once', async () => {
    let running = 0;
    let peak = 0;
    const update = vi.fn(async () => {
      running += 1;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, 1));
      running -= 1;
      return {} as never;
    });
    await bulkUpdate(Array.from({ length: 20 }, (_, i) => String(i)), {}, update);
    expect(peak).toBe(BULK_CONCURRENCY);
  });

  it('does nothing with no ids', async () => {
    const update = vi.fn();
    expect(await bulkUpdate([], {}, update)).toEqual([]);
    expect(update).not.toHaveBeenCalled();
  });
});

describe('selection and composer stores', () => {
  beforeEach(() => {
    useSelectionStore.getState().clear();
    useComposerStore.getState().close();
  });

  it('toggles, sets and clears the selection', () => {
    const { toggle, set, clear } = useSelectionStore.getState();
    toggle('a');
    toggle('b');
    toggle('a');
    expect(useSelectionStore.getState().ids).toEqual(['b']);
    set(['x', 'y']);
    expect(useSelectionStore.getState().ids).toEqual(['x', 'y']);
    clear();
    expect(useSelectionStore.getState().ids).toEqual([]);
  });

  it('starts empty from the presets, and drops the draft and refusal on close', () => {
    const store = useComposerStore.getState();
    store.open('a', { ...EMPTY_PRESETS, tags: ['t'] });
    expect(useComposerStore.getState().draft.tags).toEqual(['t']);
    store.setDraft({ title: 'x' });
    store.refuse({ key: 'tagError', values: {}, draft: useComposerStore.getState().draft });
    expect(useComposerStore.getState().refusal?.key).toBe('tagError');
    store.clearRefusal();
    expect(useComposerStore.getState().refusal).toBeNull();
    store.refuse({ key: 'tagError', values: {}, draft: useComposerStore.getState().draft });
    store.close();
    expect(useComposerStore.getState()).toMatchObject({ anchor: null, refusal: null });
    expect(useComposerStore.getState().draft.title).toBe('');
  });

  it('applies a saved view to the ui store', () => {
    useUiStore.getState().applyView('v', 'table', { ...EMPTY_FILTERS, q: 'x' }, { ...DEFAULT_DISPLAY, hideEmpty: true });
    expect(useUiStore.getState()).toMatchObject({ activeViewId: 'v', view: 'table', display: { hideEmpty: true } });
    expect(useUiStore.getState().filters.q).toBe('x');
    useUiStore.getState().setDisplay({ hideEmpty: false });
    expect(useUiStore.getState().display.hideEmpty).toBe(false);
    expect(useUiStore.getState().activeViewId).toBe('v');
  });
});
