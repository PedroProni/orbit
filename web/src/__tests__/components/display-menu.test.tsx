// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { chooseOption } from '../helpers/choose-option';
import { makeSpace, resetUiStore } from '../helpers/fixtures';
import { DisplayMenu } from '@/components/tasks/display-menu';
import { DEFAULT_DISPLAY } from '@/stores/ui.constants';
import { useUiStore } from '@/stores/ui.store';

const caps = vi.hoisted(() => ({ isGuest: false }));
vi.mock('@/hooks/use-capabilities', () => ({ useCapabilities: () => ({ isGuest: caps.isGuest }) }));

const open = () => {
  renderWithProviders(<DisplayMenu space={makeSpace()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Display' }));
};

describe('DisplayMenu', () => {
  beforeEach(() => {
    caps.isGuest = false;
    resetUiStore();
    useUiStore.setState({ view: 'board' });
  });

  it('changes grouping and swimlanes, and resets collapsed columns on a new grouping', () => {
    useUiStore.setState({ display: { ...DEFAULT_DISPLAY, collapsedColumns: ['to-do'] } });
    open();
    chooseOption(screen.getByRole('combobox', { name: 'Group by' }), 'Priority');
    chooseOption(screen.getByRole('combobox', { name: 'Swimlanes' }), 'Assignee');
    const { display } = useUiStore.getState();
    expect(display.groupBy).toBe('priority');
    expect(display.swimlane).toBe('assignee');
    expect(display.collapsedColumns).toEqual([]);
  });

  it('changes the sort and only allows a direction when it is not manual', () => {
    open();
    expect((screen.getByRole('button', { name: /Ascending order/ }) as HTMLButtonElement).disabled).toBe(true);
    chooseOption(screen.getByRole('combobox', { name: 'Sort by' }), 'Points');
    expect(useUiStore.getState().display.sortBy).toBe('points');
    fireEvent.click(screen.getByRole('button', { name: /Ascending order/ }));
    expect(useUiStore.getState().display.sortDirection).toBe('desc');
    fireEvent.click(screen.getByRole('button', { name: /Descending order/ }));
    expect(useUiStore.getState().display.sortDirection).toBe('asc');
  });

  it('turns card fields, hide empty and show closed on and off', () => {
    open();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Tags' }));
    expect(useUiStore.getState().display.cardFields).not.toContain('tags');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Tags' }));
    expect(useUiStore.getState().display.cardFields).toContain('tags');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Hide empty columns' }));
    expect(useUiStore.getState().display.hideEmpty).toBe(true);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Show closed tasks' }));
    expect(useUiStore.getState().filters.includeClosed).toBe(false);
  });

  it('keeps only valid limits and replaces the one of the same column', () => {
    open();
    const input = screen.getByRole('spinbutton', { name: 'Limit for doing' });
    fireEvent.change(input, { target: { value: '3' } });
    expect(useUiStore.getState().display.wipLimits).toEqual([{ column: 'doing', limit: 3 }]);
    fireEvent.change(input, { target: { value: '5' } });
    expect(useUiStore.getState().display.wipLimits).toEqual([{ column: 'doing', limit: 5 }]);
    for (const bad of ['0', '-1', '1.5', '1000', '']) {
      fireEvent.change(input, { target: { value: '5' } });
      fireEvent.change(input, { target: { value: bad } });
      expect(useUiStore.getState().display.wipLimits).toEqual([]);
    }
  });

  it('shows the board options only on the board', () => {
    useUiStore.setState({ view: 'list' });
    open();
    expect(screen.queryByRole('combobox', { name: 'Group by' })).toBeNull();
    expect(screen.queryByRole('checkbox', { name: 'Tags' })).toBeNull();
    expect(screen.getByRole('combobox', { name: 'Sort by' })).toBeTruthy();
  });

  it('hides limits when the board is not grouped by status', () => {
    useUiStore.setState({ display: { ...DEFAULT_DISPLAY, groupBy: 'tag' } });
    open();
    expect(screen.queryByRole('spinbutton')).toBeNull();
  });

  it('does not offer a guest to group by person, since people are not readable', () => {
    caps.isGuest = true;
    open();
    fireEvent.click(screen.getByRole('combobox', { name: 'Group by' }));
    expect(screen.queryByRole('option', { name: 'Assignee' })).toBeNull();
    expect(screen.getByRole('option', { name: 'Priority' })).toBeTruthy();
  });
});
