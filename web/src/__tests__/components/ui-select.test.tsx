// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { Select } from '@/components/ui/select';

const options = [{ value: 'a', label: 'Apple' }, { value: 'b', label: 'Banana' }, { value: 'c', label: 'Cherry' }];

const setup = (props: Partial<Parameters<typeof Select>[0]> = {}) => {
  const onChange = vi.fn();
  renderWithProviders(<Select value="a" options={options} onChange={onChange} ariaLabel="Fruit" {...props} />);
  return { onChange, trigger: screen.getByRole('combobox', { name: 'Fruit' }) };
};

describe('Select', () => {
  it('shows the selected label and opens a listbox on click', () => {
    const { trigger } = setup();
    expect(trigger.textContent).toBe('Apple');
    expect(screen.queryByRole('listbox')).toBeNull();
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getAllByRole('option')).toHaveLength(3);
    expect(screen.getByRole('option', { name: 'Apple' }).getAttribute('aria-selected')).toBe('true');
  });

  it('reports the chosen value and closes', () => {
    const { trigger, onChange } = setup();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('option', { name: 'Cherry' }));
    expect(onChange).toHaveBeenCalledWith('c');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('does not report the value that is already selected', () => {
    const { trigger, onChange } = setup();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('option', { name: 'Apple' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('moves with the arrow keys and chooses with Enter', () => {
    const { trigger, onChange } = setup();
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(trigger.getAttribute('aria-activedescendant')).toBe(screen.getByRole('option', { name: 'Cherry' }).id);
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('c');
  });

  it('jumps to the option that matches what was typed', () => {
    const { trigger, onChange } = setup();
    fireEvent.keyDown(trigger, { key: 'b' });
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('keeps the keyboard choice when the list opens under a resting pointer', () => {
    const { trigger, onChange } = setup();
    fireEvent.keyDown(trigger, { key: 'c' });
    fireEvent.mouseEnter(screen.getByRole('option', { name: 'Apple' }));
    fireEvent.mouseMove(screen.getByRole('option', { name: 'Apple' }), { movementX: 0, movementY: 0 });
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('c');
  });

  it('closes on Escape without choosing', () => {
    const { trigger, onChange } = setup();
    fireEvent.click(trigger);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('closes when the pointer goes down outside', () => {
    const { trigger } = setup();
    fireEvent.click(trigger);
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('cannot be opened when disabled', () => {
    const { trigger, onChange } = setup({ disabled: true });
    expect((trigger as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(trigger);
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows the placeholder when nothing matches the value', () => {
    const { trigger } = setup({ value: '', placeholder: 'Pick one' });
    expect(trigger.textContent).toBe('Pick one');
  });
});
