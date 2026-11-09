// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { TagPicker } from '@/components/tasks/tag-picker';

describe('TagPicker', () => {
  it('matches an existing tag in another case instead of offering a duplicate, and picks it on Enter', () => {
    const onToggle = vi.fn();
    renderWithProviders(<TagPicker selected={[]} suggestions={['UI', 'backend']} onToggle={onToggle} label="Tags" />);
    const input = screen.getByRole('textbox', { name: 'Tags' });
    fireEvent.change(input, { target: { value: 'ui' } });
    expect(screen.getByRole('option', { name: 'UI' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Create tag/ })).toBeNull();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onToggle).toHaveBeenCalledWith('UI');
  });

  it('still offers a new lowercase tag when nothing matches', () => {
    const onToggle = vi.fn();
    renderWithProviders(<TagPicker selected={[]} suggestions={['UI']} onToggle={onToggle} label="Tags" />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Tags' }), { target: { value: 'Infra' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create tag infra' }));
    expect(onToggle).toHaveBeenCalledWith('infra');
  });
});
