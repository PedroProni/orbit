// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { MEMBERS, makeSpace, resetUiStore } from '../helpers/fixtures';
import { FiltersBar } from '@/components/tasks/filters-bar';
import { EMPTY_FILTERS } from '@/stores/ui.constants';
import { useUiStore } from '@/stores/ui.store';

vi.mock('@/hooks/use-orbit', () => ({ useMembers: () => ({ data: MEMBERS }) }));

const space = makeSpace();
const openFilters = () => fireEvent.click(screen.getByRole('button', { name: /^Filter/ }));

describe('FiltersBar', () => {
  beforeEach(() => {
    resetUiStore();
  });

  it('keeps its button on screen before the space arrives, so the list below does not jump', () => {
    renderWithProviders(<FiltersBar />);
    expect(screen.getByRole('button', { name: /^Filter/ })).toBeTruthy();
  });

  it('writes several statuses into the store and turns them off again, with no assignee buttons left in the popover', () => {
    renderWithProviders(<FiltersBar space={space} />);
    openFilters();
    fireEvent.click(screen.getByRole('button', { name: 'doing' }));
    fireEvent.click(screen.getByRole('button', { name: 'Completed' }));
    expect(useUiStore.getState().filters.statuses).toEqual(['doing', 'completed']);
    fireEvent.click(screen.getByRole('button', { name: 'doing' }));
    expect(useUiStore.getState().filters.statuses).toEqual(['completed']);
    expect(screen.queryByRole('button', { name: 'Bruno Lima' })).toBeNull();
  });

  it('shows the no assignee filter as a chip that can be removed', () => {
    useUiStore.setState({ filters: { ...EMPTY_FILTERS, unassigned: true } });
    renderWithProviders(<FiltersBar space={space} />);
    expect(screen.getByRole('button', { name: 'Filter, 1 active' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Remove filter No assignee' }));
    expect(useUiStore.getState().filters.unassigned).toBe(false);
  });

  it('lowercases the tag on Enter, without duplicates, and toggles show closed', () => {
    renderWithProviders(<FiltersBar space={space} />);
    openFilters();
    const tag = screen.getByLabelText('Tag') as HTMLInputElement;
    for (const value of ['URGENT', 'urgent']) {
      fireEvent.change(tag, { target: { value } });
      fireEvent.keyDown(tag, { key: 'Enter' });
    }
    expect(tag.value).toBe('');
    fireEvent.click(screen.getByLabelText('Show closed'));
    expect(useUiStore.getState().filters.tags).toEqual(['urgent']);
    expect(useUiStore.getState().filters.includeClosed).toBe(false);
  });

  it('shows one removable chip per filter and counts them on the button', () => {
    useUiStore.setState({ filters: { ...EMPTY_FILTERS, statuses: ['doing'], assigneeIds: ['u1'], tags: ['x'], includeClosed: false } });
    renderWithProviders(<FiltersBar space={space} />);
    expect(screen.getByRole('button', { name: 'Filter, 4 active' })).toBeTruthy();
    expect(screen.getByText('Status: doing')).toBeTruthy();
    expect(screen.getByText('Assignee: Ana Souza')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Remove filter Tag: x' }));
    expect(useUiStore.getState().filters.tags).toEqual([]);
    fireEvent.click(screen.getByRole('button', { name: 'Remove filter Open tasks only' }));
    expect(useUiStore.getState().filters.includeClosed).toBe(true);
  });

  it('shows no chips and no clear button without filters, and search is not a chip', () => {
    useUiStore.setState({ filters: { ...EMPTY_FILTERS, q: 'busca' } });
    renderWithProviders(<FiltersBar space={space} />);
    expect(screen.getByRole('button', { name: 'Filter' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
  });

  it('clears every filter but keeps the search', () => {
    useUiStore.setState({ filters: { ...EMPTY_FILTERS, statuses: ['done'], tags: ['x'], q: 'busca' } });
    renderWithProviders(<FiltersBar space={space} />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(useUiStore.getState().filters).toEqual({ ...EMPTY_FILTERS, q: 'busca' });
  });
});
