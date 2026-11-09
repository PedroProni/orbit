// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { makeTask } from '../helpers/fixtures';
import { TaskLinkRedirect } from '@/components/tasks/task-link-redirect';
import { ApiError } from '@/lib/api-client';
import { orbitService } from '@/services/orbit.service';

const mocks = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: mocks.replace }) }));

describe('TaskLinkRedirect', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mocks.replace.mockClear();
  });

  it('sends the link to the list that holds the task and opens it', async () => {
    vi.spyOn(orbitService, 'task').mockResolvedValue(makeTask({ id: '86abc', listId: 'l9' }));
    renderWithProviders(<TaskLinkRedirect taskId="86abc" />);
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/lists/l9?task=86abc'));
  });

  it('explains a link that does not open, without saying whether the task exists', async () => {
    vi.spyOn(orbitService, 'task').mockRejectedValue(new ApiError(404, 'Task not found'));
    renderWithProviders(<TaskLinkRedirect taskId="nope" />);
    await waitFor(() => expect(screen.getByText('This task does not exist or you do not have access to it')).toBeTruthy());
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
