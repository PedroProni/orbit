// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { makeTask } from '../helpers/fixtures';
import { useUpdateTask } from '@/hooks/use-orbit';
import { useToastStore } from '@/stores/toast.store';
import { orbitService } from '@/services/orbit.service';
import { applyTaskPatch } from '@/components/tasks/task-helpers';

const KEY = ['tasks', 'l1', {}];

const setup = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  client.setQueryData(KEY, { data: [makeTask({ id: 'a', status: 'to-do', priority: null })], total: 1 });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, ...renderHook(() => useUpdateTask(), { wrapper }) };
};

describe('applyTaskPatch', () => {
  it('applies only the fields present in the patch', () => {
    const task = makeTask({ title: 'x', status: 'to-do', priority: 'low', points: 2 });
    expect(applyTaskPatch(task, { status: 'completed' })).toMatchObject({ title: 'x', status: 'completed', priority: 'low', points: 2 });
    expect(applyTaskPatch(task, { priority: null, points: null })).toMatchObject({ priority: null, points: null });
  });
});

describe('useUpdateTask optimistic update', () => {
  it('shows the new value immediately and rolls back with an error toast on failure', async () => {
    useToastStore.setState({ items: [] });
    let reject: (reason: Error) => void = () => undefined;
    vi.spyOn(orbitService, 'updateTask').mockImplementation(() => new Promise((_, r) => (reject = r)));
    const { client, result } = setup();
    act(() => result.current.mutate({ id: 'a', patch: { status: 'completed', priority: 'urgent' } }));
    await waitFor(() => expect((client.getQueryData(KEY) as { data: Array<{ status: string }> }).data[0].status).toBe('completed'));
    expect((client.getQueryData(KEY) as { data: Array<{ priority: string }> }).data[0].priority).toBe('urgent');
    act(() => reject(new Error('boom')));
    await waitFor(() => expect(useToastStore.getState().items).toHaveLength(1));
    expect(useToastStore.getState().items[0]).toMatchObject({ kind: 'error', messageKey: 'updateFailed' });
    expect((client.getQueryData(KEY) as { data: Array<{ status: string; priority: null }> }).data[0]).toMatchObject({ status: 'to-do', priority: null });
  });
});
