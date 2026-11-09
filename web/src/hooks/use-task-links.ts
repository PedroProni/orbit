'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orbitService } from '@/services/orbit.service';
import { useToastStore } from '@/stores/toast.store';

export const usePullRequests = (taskId: string) => useQuery({ queryKey: ['pull-requests', taskId], queryFn: () => orbitService.pullRequests(taskId) });

export const usePrints = (taskId: string) => useQuery({ queryKey: ['prints', taskId], queryFn: () => orbitService.prints(taskId) });

export function useLinkPullRequest(taskId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (url: string) => orbitService.linkPullRequest(taskId, url),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['pull-requests', taskId] });
      client.invalidateQueries({ queryKey: ['task-activity', taskId] });
    },
  });
}

export function useUnlinkPullRequest(taskId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (linkId: string) => orbitService.unlinkPullRequest(taskId, linkId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['pull-requests', taskId] });
      client.invalidateQueries({ queryKey: ['task-activity', taskId] });
    },
    onError: () => useToastStore.getState().push('error', 'pullRequestUnlinkFailed'),
  });
}
