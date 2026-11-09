'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { makeTempTask } from '@/components/tasks/task-composer.helpers';
import { orbitService } from '@/services/orbit.service';
import { Task, TaskPage } from '@/types/api.types';
import { OPTIMISTIC_CREATE_KEY } from '@/hooks/use-optimistic-create.constants';
import { ALL_TASKS_KEY } from '@/config/app.constants';
import { OptimisticCreateOptions, OptimisticCreateVariables } from '@/hooks/use-optimistic-create.types';

let nextTempId = 1;

const mapPages = (client: ReturnType<typeof useQueryClient>, listId: string, change: (tasks: Task[]) => Task[]): void => {
  for (const key of [listId, ALL_TASKS_KEY]) client.setQueriesData<TaskPage>({ queryKey: ['tasks', key] }, (page) => (page ? { ...page, data: change(page.data) } : page));
};

export function useOptimisticCreate<T>({ onCreated, onRefused }: OptimisticCreateOptions<T>) {
  const client = useQueryClient();
  return useMutation({
    mutationKey: OPTIMISTIC_CREATE_KEY,
    mutationFn: ({ listId, input }: OptimisticCreateVariables<T>) => orbitService.createTask(listId, input),
    onMutate: async ({ listId, spaceId, fallbackStatus, input }) => {
      await Promise.all([client.cancelQueries({ queryKey: ['tasks', listId] }), client.cancelQueries({ queryKey: ['tasks', ALL_TASKS_KEY] })]);
      const temp = makeTempTask(String(nextTempId++), listId, spaceId, input.status ?? fallbackStatus, input);
      mapPages(client, listId, (tasks) => [...tasks, temp]);
      return { tempId: temp.id };
    },
    onSuccess: (created, variables, context) => {
      mapPages(client, variables.listId, (tasks) => {
        const known = tasks.some((task) => task.id === created.id);
        return known ? tasks.filter((task) => task.id !== context.tempId) : tasks.map((task) => (task.id === context.tempId ? created : task));
      });
      onCreated?.(created, variables.origin);
    },
    onError: (error, variables, context) => {
      mapPages(client, variables.listId, (tasks) => tasks.filter((task) => task.id !== context?.tempId));
      onRefused?.(error, variables.origin);
    },
    onSettled: (_data, _error, variables) => {
      if (client.isMutating({ mutationKey: OPTIMISTIC_CREATE_KEY }) <= 1) {
        client.invalidateQueries({ queryKey: ['tasks', variables.listId] });
        client.invalidateQueries({ queryKey: ['tasks', ALL_TASKS_KEY] });
        client.invalidateQueries({ queryKey: ['assignee-counts'] });
      }
    },
  });
}
