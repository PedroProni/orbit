// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { TaskDescription } from '@/components/tasks/task-description';

describe('TaskDescription', () => {
  it('shows an Add description placeholder that opens the editor and saves on Ctrl+Enter', () => {
    const onSave = vi.fn();
    renderWithProviders(<TaskDescription value="" readOnly={false} onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add description' }));
    const editor = screen.getByRole('textbox', { name: 'Description' });
    fireEvent.change(editor, { target: { value: 'Novo texto' } });
    fireEvent.keyDown(editor, { key: 'Enter', ctrlKey: true });
    expect(onSave).toHaveBeenCalledWith('Novo texto');
    expect(screen.queryByRole('textbox', { name: 'Description' })).toBeNull();
  });

  it('edits on click, ignores clicks on links, and Escape cancels without saving', () => {
    const onSave = vi.fn();
    renderWithProviders(<TaskDescription value={'Texto com [link](https://a.io)'} readOnly={false} onSave={onSave} />);
    fireEvent.click(screen.getByRole('link', { name: 'link' }));
    expect(screen.queryByRole('textbox', { name: 'Description' })).toBeNull();
    fireEvent.click(screen.getByText(/Texto com/));
    const editor = screen.getByRole('textbox', { name: 'Description' });
    fireEvent.change(editor, { target: { value: 'outro' } });
    fireEvent.keyDown(editor, { key: 'Escape' });
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(/Texto com/)).toBeTruthy();
  });

  it('does not save an unchanged text', () => {
    const onSave = vi.fn();
    renderWithProviders(<TaskDescription value="Igual" readOnly={false} onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit description' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('is read only for a guest: no placeholder and no editor', () => {
    const { unmount } = renderWithProviders(<TaskDescription value="" readOnly onSave={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Add description' })).toBeNull();
    unmount();
    renderWithProviders(<TaskDescription value="Corpo" readOnly onSave={vi.fn()} />);
    fireEvent.click(screen.getByText('Corpo'));
    expect(screen.queryByRole('textbox', { name: 'Description' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Edit description' })).toBeNull();
  });
});
