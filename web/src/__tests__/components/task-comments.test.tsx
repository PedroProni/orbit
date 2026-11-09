// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { MEMBERS } from '../helpers/fixtures';
import { TaskComments } from '@/components/tasks/task-comments';
import { orbitService } from '@/services/orbit.service';
import { useToastStore } from '@/stores/toast.store';

vi.mock('@/hooks/use-capabilities', async (original) => ({ ...(await original<object>()), useCapabilities: () => ({ loaded: true, isGuest: false, member: true, userId: 'u1', canModerateComments: false }) }));

describe('TaskComments', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useToastStore.setState({ items: [] });
    vi.spyOn(orbitService, 'comments').mockResolvedValue([]);
    vi.spyOn(orbitService, 'members').mockResolvedValue(MEMBERS);
    vi.spyOn(orbitService, 'attachments').mockResolvedValue([]);
  });

  it('sends the mentioned people to the API', async () => {
    const add = vi.spyOn(orbitService, 'addComment').mockResolvedValue({ id: 'c1' } as never);
    renderWithProviders(<TaskComments taskId="t1" />);
    await act(async () => {});
    fireEvent.change(screen.getByLabelText('Write a comment (markdown)'), { target: { value: 'olha @Ana Souza', selectionStart: 15 } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(add).toHaveBeenCalledWith('t1', 'olha @Ana Souza', ['u1']));
  });

  it('keeps the text and warns when the comment is refused', async () => {
    vi.spyOn(orbitService, 'addComment').mockRejectedValue(new Error('no'));
    renderWithProviders(<TaskComments taskId="t1" />);
    await act(async () => {});
    const box = screen.getByLabelText('Write a comment (markdown)') as HTMLTextAreaElement;
    fireEvent.change(box, { target: { value: 'fica aqui' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(useToastStore.getState().items[0]?.messageKey).toBe('commentFailed'));
    expect(box.value).toBe('fica aqui');
  });
});
