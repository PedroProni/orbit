import { FolderNode, ListNode, SpaceNode } from '@/types/api.types';

export type HierarchyFolder = FolderNode & { lists?: ListNode[] };

export type HierarchyResponse = Omit<SpaceNode, 'folders'> & { folders: HierarchyFolder[] };
