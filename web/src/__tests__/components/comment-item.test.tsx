// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { MEMBERS } from '../helpers/fixtures';
import { CommentItem } from '@/components/tasks/comment-item';
import { TaskComment } from '@/types/api.types';

const mocks = vi.hoisted(() => ({ edit: vi.fn(), remove: vi.fn(), caps: { userId: 'u1', canModerateComments: false } }));

vi.mock('@/hooks/use-capabilities', () => ({ useCapabilities: () => mocks.caps }));
vi.mock('@/hooks/use-orbit', () => ({
  useMembers: () => ({ data: MEMBERS }),
  useEditComment: () => ({ mutate: mocks.edit, isPending: false }),
  useDeleteComment: () => ({ mutate: mocks.remove, isPending: false }),
}));

const comment: TaskComment = { id: 'c1', taskId: 't1', authorId: 'u1', bodyMd: 'texto original', dailyLogDate: null, editedAt: null, createdAt: '2026-11-04T10:00:00Z' };
const show = (over: Partial<TaskComment> = {}) => renderWithProviders(<CommentItem taskId="t1" comment={{ ...comment, ...over }} members={MEMBERS} attachments={[]} onRemoveAttachment={vi.fn()} />);

describe('CommentItem', () => {
  beforeEach(() => {
    mocks.edit.mockClear();
    mocks.remove.mockClear();
    mocks.caps = { userId: 'u1', canModerateComments: false };
  });

  it('lets the author edit and sends the people mentioned in the new text', () => {
    show();
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByLabelText('Edit'), { target: { value: 'agora com @Bruno Lima' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(mocks.edit).toHaveBeenCalledWith({ id: 'c1', bodyMd: 'agora com @Bruno Lima', mentionIds: ['u2'] }, expect.any(Object));
  });

  it('does not save a blank edit and cancel restores the text', () => {
    show();
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByLabelText('Edit'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(mocks.edit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByLabelText('Edit')).toBeNull();
    expect(screen.getByText('texto original')).toBeTruthy();
  });

  it('asks before deleting', () => {
    show();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toContain('Delete this comment?');
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(mocks.remove).toHaveBeenCalledWith('c1', expect.any(Object));
  });

  it('shows no actions on a comment from someone else', () => {
    mocks.caps = { userId: 'u2', canModerateComments: false };
    show();
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
  });

  it('lets an admin delete but not edit a comment from someone else', () => {
    mocks.caps = { userId: 'u2', canModerateComments: true };
    show();
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeTruthy();
  });

  it('marks an edited comment', () => {
    show({ editedAt: '2026-11-04T11:00:00Z' });
    expect(screen.getByText(/edited/)).toBeTruthy();
  });
});
