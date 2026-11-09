import { Member, SpaceNode, Task } from '@/types/api.types';
import { DEFAULT_DISPLAY, EMPTY_FILTERS } from '@/stores/ui.constants';
import { useUiStore } from '@/stores/ui.store';

export const makeTask = (over: Partial<Task> = {}): Task => ({ id: 't1', listId: 'l1', spaceId: 's1', parentId: null, title: 'Task one', descriptionMd: '', status: 'to-do', priority: null, tags: [], assigneeIds: [], watcherIds: [], points: null, startDate: null, dueDate: null, checklists: [], customFields: [], creatorId: 'u1', dateClosed: null, archived: false, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', ...over });

export const makeSpace = (over: Partial<SpaceNode> = {}): SpaceNode => ({ id: 's1', name: 'Engineering', statuses: [{ name: 'to-do', color: '#888888', type: 'open', order: 0 }, { name: 'doing', color: '#0000ff', type: 'active', order: 1 }, { name: 'completed', color: '#00ff00', type: 'done', order: 2 }], requiredTags: [], titlePrefixes: [], folders: [], lists: [], ...over });

export const MEMBERS: Member[] = [
  { id: 'u1', email: 'ana@x.io', name: 'Ana Souza', avatarUrl: null, role: 'owner', status: 'active' },
  { id: 'u2', email: 'bruno@x.io', name: 'Bruno Lima', avatarUrl: null, role: 'member', status: 'active' },
];

export const resetUiStore = () => useUiStore.setState({ view: 'list', filters: EMPTY_FILTERS, openTaskId: null, sidebarOpen: false, display: DEFAULT_DISPLAY, activeViewId: null });
