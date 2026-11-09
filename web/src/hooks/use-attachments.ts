'use client';

import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orbitService } from '@/services/orbit.service';
import { putWithProgress } from '@/lib/upload';
import { useToastStore } from '@/stores/toast.store';
import { mimeOf, validateFile } from '@/components/attachments/attachments.helpers';
import { UploadController, UploadItem } from '@/components/attachments/attachments.types';
import { AttachmentGallery } from '@/types/api.types';

export const useAttachments = (taskId: string | null) => useQuery({ queryKey: ['attachments', taskId], queryFn: () => orbitService.attachments(taskId as string), enabled: !!taskId });

export const useAttachmentUrl = (id: string, enabled: boolean) => useQuery({ queryKey: ['attachment-url', id], queryFn: () => orbitService.attachmentDownload(id), enabled, staleTime: 90000 });

export function useRemoveAttachment(taskId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => orbitService.removeAttachment(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['attachments', taskId] });
      client.invalidateQueries({ queryKey: ['prints', taskId] });
    },
    onError: () => useToastStore.getState().push('error', 'attachRemoveFailed'),
  });
}

export function useUploads(taskId: string, gallery?: AttachmentGallery): UploadController {
  const client = useQueryClient();
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const patch = useCallback((id: string, change: Partial<UploadItem>) => setUploads((list) => list.map((u) => (u.id === id ? { ...u, ...change } : u))), []);
  const dismiss = useCallback((id: string) => setUploads((list) => list.filter((u) => u.id !== id)), []);

  const uploadOne = useCallback(
    async (file: File, commentId?: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const check = validateFile(file);
      if (check.errorKey) {
        setUploads((list) => [...list, { id, name: file.name, progress: 0, status: 'error', errorKey: check.errorKey, errorValues: check.values }]);
        return;
      }
      setUploads((list) => [...list, { id, name: file.name, progress: 0, status: 'uploading', errorKey: null, errorValues: {} }]);
      try {
        const mimeType = mimeOf(file);
        const request = await orbitService.requestUpload(taskId, { filename: file.name, mimeType, sizeBytes: file.size, commentId, gallery });
        await putWithProgress(request.uploadUrl, file, mimeType, (progress) => patch(id, { progress }));
        await orbitService.confirmUpload(request.id);
        patch(id, { progress: 100, status: 'done' });
        client.invalidateQueries({ queryKey: ['attachments', taskId] });
        client.invalidateQueries({ queryKey: ['prints', taskId] });
        client.invalidateQueries({ queryKey: ['task-activity', taskId] });
        setTimeout(() => dismiss(id), 1500);
      } catch {
        patch(id, { status: 'error', errorKey: 'uploadFailed', errorValues: { name: file.name } });
      }
    },
    [taskId, gallery, client, patch, dismiss],
  );

  const start = useCallback(async (files: File[], commentId?: string) => void (await Promise.all(files.map((f) => uploadOne(f, commentId)))), [uploadOne]);
  return { uploads, start, dismiss };
}
