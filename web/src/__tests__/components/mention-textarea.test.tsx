// @vitest-environment jsdom
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { MEMBERS } from '../helpers/fixtures';
import { MentionTextarea } from '@/components/tasks/mention-textarea';

vi.mock('@/hooks/use-orbit', () => ({ useMembers: () => ({ data: MEMBERS }) }));

function Host() {
  const [value, setValue] = useState('');
  return <MentionTextarea label="Comment" value={value} onChange={setValue} />;
}

const type = (text: string) => {
  const box = screen.getByLabelText('Comment') as HTMLTextAreaElement;
  fireEvent.change(box, { target: { value: text, selectionStart: text.length } });
  return box;
};

describe('MentionTextarea', () => {
  it('lists people after an at sign and inserts the chosen name with Enter', () => {
    renderWithProviders(<Host />);
    const box = type('oi @bru');
    expect(screen.getByRole('listbox')).toBeTruthy();
    expect(screen.getAllByRole('option')).toHaveLength(1);
    fireEvent.keyDown(box, { key: 'Enter' });
    expect(box.value).toBe('oi @Bruno Lima ');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('moves through the list with the arrows', () => {
    renderWithProviders(<Host />);
    const box = type('@');
    fireEvent.keyDown(box, { key: 'ArrowDown' });
    fireEvent.keyDown(box, { key: 'Enter' });
    expect(box.value).toBe('@Bruno Lima ');
  });

  it('inserts on click', () => {
    renderWithProviders(<Host />);
    const box = type('@an');
    fireEvent.click(screen.getByRole('button', { name: /Ana Souza/ }));
    expect(box.value).toBe('@Ana Souza ');
  });

  it('closes with Escape and leaves the typed text', () => {
    renderWithProviders(<Host />);
    const box = type('@an');
    fireEvent.keyDown(box, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(box.value).toBe('@an');
  });

  it('shows nothing when nobody matches', () => {
    renderWithProviders(<Host />);
    type('@zzz');
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
