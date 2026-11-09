// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { TaskPrintsSlot } from '@/components/tasks/task-prints-slot';
import { TaskPullRequestSlot } from '@/components/tasks/task-pull-request-slot';
import { TaskUrlSlot } from '@/components/tasks/task-url-slot';
import { ApiError } from '@/lib/api-client';
import { orbitService } from '@/services/orbit.service';
import { Attachment, PullRequestLink } from '@/types/api.types';

const pr = (over: Partial<PullRequestLink>): PullRequestLink => ({
  id: 'p1',
  taskId: 't1',
  repository: 'acme-org/orbit',
  number: 12,
  url: 'https://github.com/acme-org/orbit/pull/12',
  title: 'Ajusta login',
  state: 'open',
  source: 'webhook',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...over,
});
const print = (over: Partial<Attachment>): Attachment => ({ id: 'a1', taskId: 't1', commentId: null, filename: 'tela.png', mimeType: 'image/png', sizeBytes: 10, uploaderId: 'u1', confirmed: true, gallery: 'prints', createdAt: '2026-01-01T00:00:00Z', ...over });

describe('TaskUrlSlot', () => {
  it('shows a muted Add action, saves a valid link and refuses one that is not http', () => {
    const onSave = vi.fn();
    renderWithProviders(<TaskUrlSlot label="Figma" addLabel="Add Figma" value={null} readOnly={false} onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add Figma' }));
    const input = screen.getByRole('textbox', { name: 'Figma' });
    fireEvent.change(input, { target: { value: 'javascript:alert(1)' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByRole('alert').textContent).toBe('Use a link that starts with http:// or https://');
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: ' https://figma.com/file/x ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSave).toHaveBeenCalledWith('https://figma.com/file/x');
  });

  it('opens the saved link safely, edits it, clears it, and Escape cancels', () => {
    const onSave = vi.fn();
    renderWithProviders(<TaskUrlSlot label="Notion" addLabel="Add Notion doc" value="https://notion.so/doc" readOnly={false} onSave={onSave} />);
    const link = screen.getByRole('link', { name: 'notion.so/doc' });
    expect(link.getAttribute('rel')).toContain('noopener');
    fireEvent.click(screen.getByRole('button', { name: 'Edit Notion' }));
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Notion' }), { key: 'Escape' });
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Clear Notion' }));
    expect(onSave).toHaveBeenCalledWith(null);
  });

  it('is read only for a guest', () => {
    const { unmount } = renderWithProviders(<TaskUrlSlot label="Figma" addLabel="Add Figma" value={null} readOnly onSave={vi.fn()} />);
    expect(screen.queryByRole('button')).toBeNull();
    unmount();
    renderWithProviders(<TaskUrlSlot label="Figma" addLabel="Add Figma" value="https://figma.com/x" readOnly onSave={vi.fn()} />);
    expect(screen.getByRole('link', { name: 'figma.com/x' })).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('TaskPullRequestSlot', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('lists linked pull requests with their state, and only a manual one can be unlinked', async () => {
    vi.spyOn(orbitService, 'pullRequests').mockResolvedValue([pr({}), pr({ id: 'p2', number: 13, state: 'merged', source: 'manual' })]);
    const unlink = vi.spyOn(orbitService, 'unlinkPullRequest').mockResolvedValue(undefined);
    renderWithProviders(<TaskPullRequestSlot taskId="t1" readOnly={false} />);
    expect(await screen.findByRole('link', { name: 'acme-org/orbit#12' })).toBeTruthy();
    expect(screen.getByText('merged')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Unlink acme-org/orbit#12' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Unlink acme-org/orbit#13' }));
    await waitFor(() => expect(unlink).toHaveBeenCalledWith('t1', 'p2'));
  });

  it('links a pull request by url and shows the refusal in place', async () => {
    vi.spyOn(orbitService, 'pullRequests').mockResolvedValue([]);
    const link = vi
      .spyOn(orbitService, 'linkPullRequest')
      .mockRejectedValueOnce(new ApiError(400, 'Not a GitHub pull request link'))
      .mockResolvedValueOnce(pr({ source: 'manual' }));
    renderWithProviders(<TaskPullRequestSlot taskId="t1" readOnly={false} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Add GitHub link' }));
    const input = screen.getByRole('textbox', { name: 'Link PR' });
    fireEvent.change(input, { target: { value: 'https://example.com/x' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect((await screen.findByRole('alert')).textContent).toBe('That is not a GitHub pull request link');
    fireEvent.change(input, { target: { value: 'https://github.com/acme-org/orbit/pull/12' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(link).toHaveBeenLastCalledWith('t1', 'https://github.com/acme-org/orbit/pull/12'));
    await waitFor(() => expect(screen.queryByRole('textbox', { name: 'Link PR' })).toBeNull());
  });

  it('shows the list to a guest with no way to link or unlink', async () => {
    vi.spyOn(orbitService, 'pullRequests').mockResolvedValue([pr({ source: 'manual' })]);
    renderWithProviders(<TaskPullRequestSlot taskId="t1" readOnly />);
    expect(await screen.findByRole('link', { name: 'acme-org/orbit#12' })).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('wraps a long pull request name instead of cutting it, the title gives way first and the state stays in view', async () => {
    vi.spyOn(orbitService, 'pullRequests').mockResolvedValue([pr({ state: 'merged' })]);
    renderWithProviders(<TaskPullRequestSlot taskId="t1" readOnly={false} />);
    const classes = (await screen.findByRole('link', { name: 'acme-org/orbit#12' })).className.split(' ');
    expect(classes).toEqual(expect.arrayContaining(['min-w-0', '[overflow-wrap:anywhere]']));
    expect(classes).not.toContain('shrink-0');
    expect(classes).not.toContain('truncate');
    expect(screen.getByText('merged').className.split(' ')).toContain('shrink-0');
    expect(screen.getByText('Ajusta login').className.split(' ')).toEqual(expect.arrayContaining(['min-w-0', 'shrink-[100]', 'truncate']));
  });
});

describe('TaskPrintsSlot', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('shows confirmed prints as thumbnails and removes one after confirming', async () => {
    vi.spyOn(orbitService, 'prints').mockResolvedValue([print({}), print({ id: 'a2', filename: 'pendente.png', confirmed: false })]);
    const remove = vi.spyOn(orbitService, 'removeAttachment').mockResolvedValue(undefined);
    renderWithProviders(<TaskPrintsSlot taskId="t1" readOnly={false} folder={null} onSaveFolder={vi.fn()} />);
    const image = (await screen.findByRole('img', { name: 'tela.png' })) as HTMLImageElement;
    expect(image.src).toContain('/attachments/a1/content');
    expect(screen.queryByRole('img', { name: 'pendente.png' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Remove tela.png' }));
    expect(remove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(remove).toHaveBeenCalledWith('a1'));
  });

  it('uploads picked images into the prints gallery', async () => {
    vi.spyOn(orbitService, 'prints').mockResolvedValue([]);
    const request = vi.spyOn(orbitService, 'requestUpload').mockRejectedValue(new Error('stop'));
    renderWithProviders(<TaskPrintsSlot taskId="t1" readOnly={false} folder={null} onSaveFolder={vi.fn()} />);
    const file = new File(['x'], 'nova.png', { type: 'image/png' });
    fireEvent.change(screen.getByTestId('prints-input'), { target: { files: [file] } });
    await waitFor(() => expect(request).toHaveBeenCalledWith('t1', { filename: 'nova.png', mimeType: 'image/png', sizeBytes: 1, commentId: undefined, gallery: 'prints' }));
  });

  it('saves the prints folder link', () => {
    vi.spyOn(orbitService, 'prints').mockResolvedValue([]);
    const onSaveFolder = vi.fn();
    renderWithProviders(<TaskPrintsSlot taskId="t1" readOnly={false} folder={null} onSaveFolder={onSaveFolder} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add prints' }));
    const input = screen.getByRole('textbox', { name: 'Prints folder' });
    fireEvent.change(input, { target: { value: 'https://drive.example.com/pasta' } });
    fireEvent.blur(input);
    expect(onSaveFolder).toHaveBeenCalledWith('https://drive.example.com/pasta');
  });

  it('gives a guest the gallery only, with no upload or remove', async () => {
    vi.spyOn(orbitService, 'prints').mockResolvedValue([print({})]);
    renderWithProviders(<TaskPrintsSlot taskId="t1" readOnly folder={null} onSaveFolder={vi.fn()} />);
    expect(await screen.findByRole('img', { name: 'tela.png' })).toBeTruthy();
    expect(screen.queryByTestId('prints-input')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByText('-')).toBeNull();
  });

  it('shows a guest the empty mark only when there is no folder and no print', async () => {
    const list = vi.spyOn(orbitService, 'prints').mockResolvedValue([]);
    renderWithProviders(<TaskPrintsSlot taskId="t1" readOnly folder={null} onSaveFolder={vi.fn()} />);
    await waitFor(() => expect(list).toHaveBeenCalled());
    expect(screen.getByText('-')).toBeTruthy();
  });
});
