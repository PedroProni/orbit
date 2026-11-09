import { describe, expect, it } from 'vitest';
import { normalizeSpace } from '@/services/hierarchy.helpers';
import { HierarchyResponse } from '@/services/hierarchy.types';

const space: HierarchyResponse = {
  id: 's',
  name: 'Acme',
  statuses: [],
  requiredTags: [],
  titlePrefixes: [],
  lists: [{ id: 'loose', spaceId: 's', folderId: null, name: 'Loose', kind: 'list' }],
  folders: [{ id: 'f', spaceId: 's', name: 'Folder', lists: [{ id: 'nested', spaceId: 's', folderId: 'f', name: 'Nested', kind: 'sprint' }] }],
};

describe('normalizeSpace', () => {
  it('moves folder lists into the flat list with the folder id', () => {
    const result = normalizeSpace(space);
    expect(result.lists.map((l) => [l.id, l.folderId])).toEqual([['loose', null], ['nested', 'f']]);
    expect(result.folders[0]).not.toHaveProperty('lists');
  });

  it('does not duplicate lists already present at the top level', () => {
    const withDup = { ...space, lists: [...space.lists, { id: 'nested', spaceId: 's', folderId: 'f', name: 'Nested', kind: 'sprint' as const }] };
    expect(normalizeSpace(withDup).lists.filter((l) => l.id === 'nested')).toHaveLength(1);
  });
});
