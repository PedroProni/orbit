import { Principal, SpaceNode, StatusDefinition } from '@/types/api.types';

export const DEFAULTS: StatusDefinition[] = [
  { name: 'backlog', color: '#94a3b8', type: 'open', order: 0 },
  { name: 'to-do', color: '#64748b', type: 'open', order: 1 },
  { name: 'stuck', color: '#ef4444', type: 'active', order: 2 },
  { name: 'in development', color: '#3b82f6', type: 'active', order: 3 },
  { name: 'waiting review', color: '#f59e0b', type: 'review', order: 4 },
  { name: 'in review', color: '#a855f7', type: 'review', order: 5 },
  { name: 'completed', color: '#22c55e', type: 'done', order: 6 },
];

export const principal = (role: string): Principal =>
  ({
    id: 'me',
    email: 'me@orbit.test',
    name: 'me',
    avatarUrl: null,
    role,
    status: 'active',
    workspaceId: 'w1',
    scopes: [],
  }) as unknown as Principal;

export const adminSpace = (over: Partial<SpaceNode> = {}): SpaceNode => ({
  id: 's1',
  name: 'Engineering',
  statuses: [...DEFAULTS, { name: 'blocked by client', color: '#ec4899', type: 'active', order: 7 }],
  requiredTags: [],
  titlePrefixes: [],
  folders: [{ id: 'f1', spaceId: 's1', name: 'Q4' }],
  lists: [
    {
      id: 'l1',
      spaceId: 's1',
      folderId: null,
      name: 'Backlog list',
      kind: 'list',
    },
    {
      id: 'l2',
      spaceId: 's1',
      folderId: 'f1',
      name: 'Sprint 12',
      kind: 'sprint',
      startDate: '2026-11-02T12:00:00.000Z',
      endDate: '2026-11-13T12:00:00.000Z',
    },
  ],
  ...over,
});
