// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { TaskAttachments } from '@/components/attachments/task-attachments';
import { TaskActionLinks } from '@/components/tasks/task-action-links';
import { useUploads } from '@/hooks/use-attachments';
import { orbitService } from '@/services/orbit.service';
import * as upload from '@/lib/upload';
import { Attachment } from '@/types/api.types';

vi.mock('@/lib/upload', () => ({ putWithProgress: vi.fn() }));

const att = (over: Partial<Attachment> = {}): Attachment => ({ id: 'a1', taskId: 't1', commentId: null, filename: 'spec.pdf', mimeType: 'application/pdf', sizeBytes: 2048, uploaderId: 'u1', confirmed: true, createdAt: '2026-01-01T00:00:00Z', ...over });

function Harness() {
  const controller = useUploads('t1');
  return (
    <>
      <TaskAttachments taskId="t1" controller={controller} />
      <TaskActionLinks canAddSubtask={false} onAddSubtask={vi.fn()} onAddDependency={vi.fn()} onAddChecklist={vi.fn()} onAttach={(files) => controller.start(files)} />
    </>
  );
}

describe('TaskAttachments', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(upload.putWithProgress).mockReset();
  });

  it('shows no section when empty and lists confirmed task attachments with size', async () => {
    vi.spyOn(orbitService, 'attachments').mockResolvedValue([]);
    const first = renderWithProviders(<Harness />);
    await waitFor(() => expect(orbitService.attachments).toHaveBeenCalled());
    expect(screen.queryByText('Attachments')).toBeNull();
    expect(screen.queryByTestId('attach-input')).toBeNull();
    first.unmount();
    vi.spyOn(orbitService, 'attachments').mockResolvedValue([att(), att({ id: 'a2', filename: 'hidden.txt', confirmed: false }), att({ id: 'a3', filename: 'comment.txt', commentId: 'c1' })]);
    renderWithProviders(<Harness />);
    expect(await screen.findByText('spec.pdf')).toBeTruthy();
    expect(screen.getByText('2.0 KB')).toBeTruthy();
    expect(screen.queryByText('hidden.txt')).toBeNull();
    expect(screen.queryByText('comment.txt')).toBeNull();
  });

  it('runs request, put with progress and confirm, then refreshes the list', async () => {
    const list = vi.spyOn(orbitService, 'attachments').mockResolvedValue([]);
    const request = vi.spyOn(orbitService, 'requestUpload').mockResolvedValue({ ...att({ confirmed: false }), uploadUrl: 'https://bucket/put' });
    const confirm = vi.spyOn(orbitService, 'confirmUpload').mockResolvedValue(att());
    vi.mocked(upload.putWithProgress).mockImplementation(async (_u, _f, _m, onProgress) => onProgress(60));
    renderWithProviders(<Harness />);
    await waitFor(() => expect(orbitService.attachments).toHaveBeenCalled());
    const file = new File(['hello'], 'notes.txt', { type: 'text/plain' });
    fireEvent.change(screen.getByTestId('action-attach-input'), { target: { files: [file] } });
    await waitFor(() => expect(confirm).toHaveBeenCalledWith('a1'));
    expect(request).toHaveBeenCalledWith('t1', { filename: 'notes.txt', mimeType: 'text/plain', sizeBytes: 5, commentId: undefined });
    expect(upload.putWithProgress).toHaveBeenCalledWith('https://bucket/put', file, 'text/plain', expect.any(Function));
    await waitFor(() => expect(list.mock.calls.length).toBeGreaterThan(1));
  });

  it('shows a validation message and never calls the API for a blocked file', async () => {
    vi.spyOn(orbitService, 'attachments').mockResolvedValue([]);
    const request = vi.spyOn(orbitService, 'requestUpload');
    renderWithProviders(<Harness />);
    await waitFor(() => expect(orbitService.attachments).toHaveBeenCalled());
    fireEvent.change(screen.getByTestId('action-attach-input'), { target: { files: [new File(['x'], 'setup.exe')] } });
    expect((await screen.findByRole('alert')).textContent).toBe('setup.exe: .exe files are not allowed');
    expect(request).not.toHaveBeenCalled();
  });

  it('shows the upload failure when the storage PUT is rejected', async () => {
    vi.spyOn(orbitService, 'attachments').mockResolvedValue([]);
    vi.spyOn(orbitService, 'requestUpload').mockResolvedValue({ ...att({ confirmed: false }), uploadUrl: 'https://bucket/put' });
    const confirm = vi.spyOn(orbitService, 'confirmUpload');
    vi.mocked(upload.putWithProgress).mockRejectedValue(new Error('403'));
    renderWithProviders(<Harness />);
    await waitFor(() => expect(orbitService.attachments).toHaveBeenCalled());
    fireEvent.change(screen.getByTestId('action-attach-input'), { target: { files: [new File(['x'], 'a.txt', { type: 'text/plain' })] } });
    expect((await screen.findByRole('alert')).textContent).toBe('Could not upload a.txt');
    expect(confirm).not.toHaveBeenCalled();
  });

  it('removes an attachment only after confirmation', async () => {
    vi.spyOn(orbitService, 'attachments').mockResolvedValue([att()]);
    const remove = vi.spyOn(orbitService, 'removeAttachment').mockResolvedValue(undefined);
    renderWithProviders(<Harness />);
    await screen.findByText('spec.pdf');
    fireEvent.click(screen.getByRole('button', { name: 'Remove spec.pdf' }));
    expect(remove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(remove.mock.calls[0][0]).toBe('a1'));
  });

  it('renders an image thumbnail from the signed url', async () => {
    vi.spyOn(orbitService, 'attachments').mockResolvedValue([att({ filename: 'shot.png', mimeType: 'image/png' })]);
    vi.spyOn(orbitService, 'attachmentDownload').mockResolvedValue({ url: 'https://bucket/shot.png?sig=1', expiresInSeconds: 120 });
    renderWithProviders(<Harness />);
    const img = await screen.findByRole('img', { name: 'shot.png' });
    expect(img.getAttribute('src')).toBe('https://bucket/shot.png?sig=1');
  });
});
