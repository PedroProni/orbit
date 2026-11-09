import { ListNode, SpaceNode } from '@/types/api.types';
import { ListPickerGroup } from './list-picker.types';

const matches = (list: ListNode, needle: string): boolean => list.name.toLowerCase().includes(needle);

export function listGroups(spaces: SpaceNode[], query: string): ListPickerGroup[] {
  const needle = query.trim().toLowerCase();
  return spaces.flatMap((space) => {
    const spaceHit = needle !== '' && space.name.toLowerCase().includes(needle);
    const pick = (lists: ListNode[]) => (spaceHit ? lists : lists.filter((list) => matches(list, needle)));
    const loose = pick(space.lists.filter((list) => !list.folderId));
    const folders = space.folders
      .map((folder) => ({ key: folder.id, label: folder.name, depth: 1, lists: folder.name.toLowerCase().includes(needle) && needle ? space.lists.filter((list) => list.folderId === folder.id) : pick(space.lists.filter((list) => list.folderId === folder.id)) }))
      .filter((group) => group.lists.length > 0);
    if (loose.length === 0 && folders.length === 0) return [];
    return [{ key: space.id, label: space.name, depth: 0, lists: loose }, ...folders];
  });
}

export const findList = (spaces: SpaceNode[], listId: string | null): ListNode | undefined => (listId ? spaces.flatMap((space) => space.lists).find((list) => list.id === listId) : undefined);
