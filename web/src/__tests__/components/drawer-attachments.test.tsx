// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { TaskCommentComposer } from '@/components/tasks/task-comment-composer';
import { orbitService } from '@/services/orbit.service';
import { MEMBERS } from '../helpers/fixtures';

describe('comment box attachments', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('keeps picked files pending and uploads them with the new comment id on send', async () => {
    vi.spyOn(orbitService, 'comments').mockResolvedValue([]);
    vi.spyOn(orbitService, 'members').mockResolvedValue(MEMBERS);
    vi.spyOn(orbitService, 'attachments').mockResolvedValue([]);
    vi.spyOn(orbitService, 'addComment').mockResolvedValue({ id: 'c9', taskId: 't1', authorId: 'u1', bodyMd: 'hi', dailyLogDate: null, editedAt: null, createdAt: '2026-01-01T00:00:00Z' });
    const request = vi.spyOn(orbitService, 'requestUpload').mockRejectedValue(new Error('stop'));
    renderWithProviders(<TaskCommentComposer taskId="t1" />);
    const file = new File(['x'], 'log.txt', { type: 'text/plain' });
    fireEvent.change(screen.getByTestId('attach-input'), { target: { files: [file] } });
    expect(screen.getByText('log.txt')).toBeTruthy();
    expect(request).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole('combobox', { name: 'Write a comment (markdown)' }), { target: { value: 'hi' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(request).toHaveBeenCalledWith('t1', { filename: 'log.txt', mimeType: 'text/plain', sizeBytes: 1, commentId: 'c9' }));
    expect(screen.queryByRole('button', { name: 'Remove log.txt' })).toBeNull();
  });

  it('drops a pending file with its remove button', async () => {
    vi.spyOn(orbitService, 'comments').mockResolvedValue([]);
    vi.spyOn(orbitService, 'members').mockResolvedValue(MEMBERS);
    vi.spyOn(orbitService, 'attachments').mockResolvedValue([]);
    renderWithProviders(<TaskCommentComposer taskId="t1" />);
    fireEvent.change(screen.getByTestId('attach-input'), { target: { files: [new File(['x'], 'a.txt')] } });
    fireEvent.click(screen.getByRole('button', { name: 'Remove a.txt' }));
    expect(screen.queryByText('a.txt')).toBeNull();
  });
});
