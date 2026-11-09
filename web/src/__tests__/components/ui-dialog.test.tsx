// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { Dialog } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';

const options = [{ value: 'a', label: 'Apple' }];

const setup = (open = true) => {
  const onClose = vi.fn();
  const outside = document.createElement('button');
  document.body.appendChild(outside);
  outside.focus();
  const view = renderWithProviders(
    <Dialog open={open} onClose={onClose} label="Details" closeLabel="Close">
      <button type="button">First</button>
      <Select value="a" options={options} onChange={vi.fn()} ariaLabel="Fruit" />
      <button type="button">Last</button>
    </Dialog>,
  );
  return { onClose, outside, view };
};

describe('Dialog', () => {
  it('renders on the page body, outside a transformed parent like the sidebar', () => {
    const { view } = setup();
    const overlay = screen.getByRole('dialog').parentElement;
    expect(overlay?.parentElement).toBe(document.body);
    expect(view.container.contains(screen.getByRole('dialog'))).toBe(false);
  });

  it('renders nothing while closed', () => {
    setup(false);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('moves focus into the panel when it opens', () => {
    setup();
    expect(document.activeElement).toBe(screen.getByRole('dialog'));
  });

  it('gives focus back when it unmounts', () => {
    const { outside, view } = setup();
    view.unmount();
    expect(document.activeElement).toBe(outside);
  });

  it('closes on Escape and on the overlay', () => {
    const { onClose } = setup();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('keeps Tab inside the panel in both directions', () => {
    setup();
    const last = screen.getByRole('button', { name: 'Last' });
    const first = screen.getByRole('button', { name: 'First' });
    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it('closes only the popover on Escape when one is open inside', () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByRole('combobox', { name: 'Fruit' }));
    expect(screen.getByRole('listbox')).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
