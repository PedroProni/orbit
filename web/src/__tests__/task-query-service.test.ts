import { afterEach, describe, expect, it, vi } from 'vitest';
import { orbitService } from '@/services/orbit.service';
import { EMPTY_FILTERS } from '@/stores/ui.constants';

const page = (ids: string[], total: number, number: number) => new Response(JSON.stringify({ data: ids.map((id) => ({ id })), total, page: number, limit: 200, totalPages: 2 }), { status: 200, headers: { 'content-type': 'application/json' } });
const urls = (fetcher: ReturnType<typeof vi.fn>) => fetcher.mock.calls.map(([url]) => new URL(String(url), 'http://x'));

describe('task queries of the services', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('asks every page of all tasks for top level tasks only, with the filters, and joins them without repeats', async () => {
    const fetcher = vi.fn().mockImplementation((url: string) => Promise.resolve(new URL(url, 'http://x').searchParams.get('page') === '1' ? page(['a', 'b'], 3, 1) : page(['b', 'c'], 3, 2)));
    vi.stubGlobal('fetch', fetcher);
    const result = await orbitService.allTaskPages({ ...EMPTY_FILTERS, unassigned: true, assigneeIds: ['u1'], q: 'x' }, 2);
    expect(result.data.map((task) => task.id)).toEqual(['a', 'b', 'c']);
    expect(result.total).toBe(3);
    for (const url of urls(fetcher)) {
      expect(url.pathname.endsWith('/tasks')).toBe(true);
      expect(url.searchParams.get('topLevel')).toBe('true');
      expect(url.searchParams.get('unassigned')).toBe('true');
      expect(url.searchParams.get('assigneeIds')).toBe('u1');
      expect(url.searchParams.get('listId')).toBeNull();
    }
    expect(
      urls(fetcher)
        .map((url) => url.searchParams.get('page'))
        .sort(),
    ).toEqual(['1', '2']);
  });

  it('counts per assignee with the list and the filters but never the people chosen', async () => {
    const fetcher = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ total: 0, unassigned: 0, byAssignee: [] }), { status: 200, headers: { 'content-type': 'application/json' } })));
    vi.stubGlobal('fetch', fetcher);
    await orbitService.assigneeCounts('l1', { ...EMPTY_FILTERS, statuses: ['doing'], assigneeIds: ['u1'], unassigned: true });
    await orbitService.assigneeCounts(null, EMPTY_FILTERS);
    const [withList, workspace] = urls(fetcher);
    expect(withList.pathname.endsWith('/tasks/assignee-counts')).toBe(true);
    expect(withList.searchParams.get('listId')).toBe('l1');
    expect(withList.searchParams.get('statuses')).toBe('doing');
    expect(withList.searchParams.get('assigneeIds')).toBeNull();
    expect(withList.searchParams.get('unassigned')).toBeNull();
    expect(workspace.searchParams.get('listId')).toBeNull();
  });

  it('sends the no assignee filter on a list only when it is on', async () => {
    const fetcher = vi.fn().mockImplementation(() => Promise.resolve(page([], 0, 1)));
    vi.stubGlobal('fetch', fetcher);
    await orbitService.tasks('l1', { ...EMPTY_FILTERS, unassigned: true });
    await orbitService.tasks('l1', EMPTY_FILTERS);
    const [on, off] = urls(fetcher);
    expect(on.searchParams.get('unassigned')).toBe('true');
    expect(off.searchParams.get('unassigned')).toBeNull();
    expect(off.searchParams.get('topLevel')).toBeNull();
  });
});
