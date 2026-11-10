'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCapabilities } from '@/hooks/use-capabilities';
import { workspaceService } from '@/services/workspace.service';
import { useToastStore } from '@/stores/toast.store';
import { CHAT_POLL_MS } from '@/components/workspace/workspace.constants';
import { InstantiateTemplateArgs } from '@/types/workspace.types';

export const useInbox = () => useQuery({ queryKey: ['inbox'], queryFn: workspaceService.inbox });
export const useDocs = () => {
  const { member } = useCapabilities();
  return useQuery({ queryKey: ['docs'], queryFn: workspaceService.docs, enabled: member });
};
export const useDoc = (id: string | null) => useQuery({ queryKey: ['doc', id], queryFn: () => workspaceService.doc(id as string), enabled: !!id });
export const useGoals = () => useQuery({ queryKey: ['goals'], queryFn: workspaceService.goals });
export const useDashboards = () => useQuery({ queryKey: ['dashboards'], queryFn: workspaceService.dashboards });
export const useDashboardData = (id: string | null) => useQuery({ queryKey: ['dashboard-data', id], queryFn: () => workspaceService.dashboardData(id as string), enabled: !!id });
export const useChannels = () => useQuery({ queryKey: ['channels'], queryFn: workspaceService.channels });
export const useMessages = (id: string | null) => useQuery({ queryKey: ['messages', id], queryFn: () => workspaceService.messages(id as string), enabled: !!id, refetchInterval: CHAT_POLL_MS });
export const useTaskPlan = (id: string) => useQuery({ queryKey: ['plan', id], queryFn: () => workspaceService.plan(id) });
export const useTaskTime = (id: string) => useQuery({ queryKey: ['time', id], queryFn: () => workspaceService.time(id) });
export const useDependencies = (id: string) => useQuery({ queryKey: ['dependencies', id], queryFn: () => workspaceService.dependencies(id) });
export const useTemplates = (spaceId: string | null) => useQuery({ queryKey: ['templates', spaceId], queryFn: () => workspaceService.templates(spaceId as string), enabled: !!spaceId });
export const useRecurrence = (id: string) => useQuery({ queryKey: ['recurrence', id], queryFn: () => workspaceService.recurrence(id) });

export const useInstantiateTemplate = () => useInvalidating(({ id, listId, title }: InstantiateTemplateArgs) => workspaceService.instantiateTemplate(id, { listId, title }), ['tasks']);

export function useInvalidating<TArgs, TResult>(fn: (args: TArgs) => Promise<TResult>, keys: string[], failureKey?: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => Promise.all(keys.map((key) => client.invalidateQueries({ queryKey: [key] }))), onError: failureKey ? () => useToastStore.getState().push('error', failureKey) : undefined });
}
