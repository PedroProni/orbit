'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orbitService } from '@/services/orbit.service';

export const useTaskGithub = (taskId: string) => useQuery({ queryKey: ['task-github', taskId], queryFn: () => orbitService.github(taskId) });

export function useRefreshGithub(taskId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => orbitService.refreshGithub(taskId),
    onSuccess: (view) => {
      client.setQueryData(['task-github', taskId], view);
      client.invalidateQueries({ queryKey: ['pull-requests', taskId] });
    },
  });
}
