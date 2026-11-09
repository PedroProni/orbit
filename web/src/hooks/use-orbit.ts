'use client';

import { useEffect } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orbitService } from '@/services/orbit.service';
import { countFilterParams } from '@/services/task-query.helpers';
import { AddCommentVariables, CreateTaskInput, CreateTaskOptions, EditCommentVariables, UpdateTaskVariables, UpdateViewVariables } from '@/services/orbit.types';
import { useSessionStore } from '@/stores/session.store';
import { useToastStore } from '@/stores/toast.store';
import { applyTaskPatch } from '@/components/tasks/task-helpers';
import { ALL_TASKS_KEY, API_BASE, REALTIME_EVENTS } from '@/config/app.constants';
import { describeCreateError } from '@/components/tasks/task-create-error';
import { useCapabilities, useMe } from '@/hooks/use-capabilities';
import { Task, TaskFilters, TaskPage } from '@/types/api.types';

export { useMe };
export const useHierarchy = () => useQuery({ queryKey: ['hierarchy'], queryFn: orbitService.hierarchy });
export const useMembers = () => {
  const { member } = useCapabilities();
  return useQuery({ queryKey: ['members'], queryFn: orbitService.members, enabled: member });
};
export const useTasks = (listId: string, filters: TaskFilters) => useQuery({ queryKey: ['tasks', listId, filters], queryFn: () => orbitService.tasks(listId, filters) });
export const useAllTasks = (filters: TaskFilters, pages: number) => useQuery({ queryKey: ['tasks', ALL_TASKS_KEY, filters, pages], queryFn: () => orbitService.allTaskPages(filters, pages), placeholderData: keepPreviousData });
export const useAssigneeCounts = (listId: string | null, filters: TaskFilters, open: boolean) => {
  const { member } = useCapabilities();
  return useQuery({ queryKey: ['assignee-counts', listId, countFilterParams(filters)], queryFn: () => orbitService.assigneeCounts(listId, filters), enabled: member && open });
};
export const useTaskActivity = (id: string | null) => useQuery({ queryKey: ['task-activity', id], queryFn: () => orbitService.taskActivity(id as string), enabled: !!id });
export const useTask = (id: string | null) => useQuery({ queryKey: ['task', id], queryFn: () => orbitService.task(id as string), enabled: !!id });
export const useSubtasks = (id: string | null) => useQuery({ queryKey: ['subtasks', id], queryFn: () => orbitService.subtasks(id as string), enabled: !!id });
export const useComments = (id: string | null) => useQuery({ queryKey: ['comments', id], queryFn: () => orbitService.comments(id as string), enabled: !!id });
export const useNotifications = () => useQuery({ queryKey: ['notifications'], queryFn: orbitService.notifications });
export const useSearch = (q: string) => {
  const { member } = useCapabilities();
  return useQuery({ queryKey: ['search', q], queryFn: () => orbitService.search(q), enabled: member && q.trim().length >= 2 });
};

export function useUpdateTask() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: UpdateTaskVariables) => orbitService.updateTask(id, patch),
    onMutate: async ({ id, patch }) => {
      await client.cancelQueries({ queryKey: ['tasks'] });
      await client.cancelQueries({ queryKey: ['task', id] });
      const snapshots = client.getQueriesData<TaskPage>({ queryKey: ['tasks'] });
      const detail = client.getQueryData<Task>(['task', id]);
      client.setQueriesData<TaskPage>({ queryKey: ['tasks'] }, (page) => (page ? { ...page, data: page.data.map((t) => (t.id === id ? applyTaskPatch(t, patch) : t)) } : page));
      if (detail) client.setQueryData<Task>(['task', id], applyTaskPatch(detail, patch));
      return { snapshots, detail };
    },
    onError: (_error, _vars, context) => {
      context?.snapshots.forEach(([key, data]) => client.setQueryData(key, data));
      if (context?.detail) client.setQueryData(['task', _vars.id], context.detail);
      useToastStore.getState().push('error', 'updateFailed');
    },
    onSettled: (_data, _error, vars) => {
      client.invalidateQueries({ queryKey: ['tasks'] });
      client.invalidateQueries({ queryKey: ['task', vars.id] });
      client.invalidateQueries({ queryKey: ['task-activity', vars.id] });
    },
  });
}

export function useCreateTask({ inlineError = false }: CreateTaskOptions = {}) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, ...input }: CreateTaskInput & { listId: string }) => orbitService.createTask(listId, input),
    onSuccess: (_task, vars) => {
      client.invalidateQueries({ queryKey: ['tasks'] });
      if (vars.parentId) client.invalidateQueries({ queryKey: ['subtasks', vars.parentId] });
      useToastStore.getState().push('success', 'created');
    },
    onError: (error) => {
      if (inlineError) return;
      const described = describeCreateError(error);
      useToastStore.getState().push('error', described.key, described.values);
    },
  });
}

export function useAddComment(taskId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ bodyMd, mentionIds }: AddCommentVariables) => orbitService.addComment(taskId, bodyMd, mentionIds),
    onSuccess: () => client.invalidateQueries({ queryKey: ['comments', taskId] }),
    onError: () => useToastStore.getState().push('error', 'commentFailed'),
  });
}

export function useEditComment(taskId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, bodyMd, mentionIds }: EditCommentVariables) => orbitService.editComment(id, bodyMd, mentionIds),
    onSuccess: () => client.invalidateQueries({ queryKey: ['comments', taskId] }),
    onError: () => useToastStore.getState().push('error', 'commentFailed'),
  });
}

export function useDeleteComment(taskId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => orbitService.deleteComment(id),
    onSuccess: () => client.invalidateQueries({ queryKey: ['comments', taskId] }),
    onError: () => useToastStore.getState().push('error', 'commentDeleteFailed'),
  });
}

export function useMarkRead() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (ids?: string[]) => orbitService.markRead(ids), onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }) });
}

export function useRealtime(enabled: boolean) {
  const client = useQueryClient();
  const authenticated = useSessionStore((s) => s.authenticated);
  useEffect(() => {
    if (!authenticated || !enabled) return;
    const source = new EventSource(`${API_BASE}/events`);
    const refresh = () => {
      client.invalidateQueries({ queryKey: ['tasks'] });
      client.invalidateQueries({ queryKey: ['task'] });
      client.invalidateQueries({ queryKey: ['comments'] });
      client.invalidateQueries({ queryKey: ['notifications'] });
      client.invalidateQueries({ queryKey: ['assignee-counts'] });
    };
    source.onmessage = refresh;
    REALTIME_EVENTS.forEach((name) => source.addEventListener(name, refresh));
    return () => source.close();
  }, [client, authenticated, enabled]);
}

export type { Task };

export const useSavedViews = (listId: string) => {
  const { member } = useCapabilities();
  return useQuery({ queryKey: ['saved-views', listId], queryFn: () => orbitService.savedViews(listId), enabled: member });
};

export function useSaveView() {
  const client = useQueryClient();
  return useMutation({ mutationFn: orbitService.saveView, onSuccess: () => client.invalidateQueries({ queryKey: ['saved-views'] }) });
}

export function useDeleteView() {
  const client = useQueryClient();
  return useMutation({ mutationFn: orbitService.deleteView, onSuccess: () => client.invalidateQueries({ queryKey: ['saved-views'] }) });
}

export function useUpdateView() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, view }: UpdateViewVariables) => orbitService.updateView(id, view),
    onSuccess: () => client.invalidateQueries({ queryKey: ['saved-views'] }),
    onError: () => useToastStore.getState().push('error', 'viewSaveFailed'),
  });
}

export const useCustomFields = (spaceId: string | undefined) => {
  const { member } = useCapabilities();
  return useQuery({ queryKey: ['custom-fields', spaceId], queryFn: () => orbitService.customFields(spaceId as string), enabled: member && !!spaceId });
};
