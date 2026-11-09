// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { DropdownMenu } from '@/components/ui/dropdown-menu';

const setup = () => {
  const open = vi.fn();
  const remove = vi.fn();
  renderWithProviders(
    <DropdownMenu label="More" items={[{ key: 'open', label: 'Open', onSelect: open }, { key: 'remove', label: 'Remove', onSelect: remove, danger: true }]}>
      <span>dots</span>
    </DropdownMenu>,
  );
  return { open, remove, trigger: screen.getByRole('button', { name: 'More' }) };
};

describe('DropdownMenu', () => {
  it('opens from the trigger and focuses the first item', () => {
    const { trigger } = setup();
    expect(screen.queryByRole('menu')).toBeNull();
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Open' }));
  });

  it('runs the item, closes and returns focus to the trigger', () => {
    const { trigger, remove } = setup();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Remove' }));
    expect(remove).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('wraps around with the arrow keys', () => {
    const { trigger } = setup();
    fireEvent.click(trigger);
    const menu = screen.getByRole('menu');
    fireEvent.keyDown(menu, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Remove' }));
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Open' }));
  });

  it('closes on Escape without running anything', () => {
    const { trigger, open } = setup();
    fireEvent.click(trigger);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
    expect(open).not.toHaveBeenCalled();
  });
});
