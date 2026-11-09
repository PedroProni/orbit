import { SpaceNode } from '@/types/api.types';
import { HierarchyResponse } from './hierarchy.types';

export const normalizeSpace = (space: HierarchyResponse): SpaceNode => {
  const nested = space.folders.flatMap((folder) => (folder.lists ?? []).map((list) => ({ ...list, folderId: folder.id })));
  const known = new Set(space.lists.map((l) => l.id));
  return { ...space, folders: space.folders.map(({ lists, ...folder }) => folder), lists: [...space.lists, ...nested.filter((l) => !known.has(l.id))] };
};
