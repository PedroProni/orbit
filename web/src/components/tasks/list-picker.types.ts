import { ListNode, SpaceNode } from '@/types/api.types';

export interface ListPickerProps {
  spaces: SpaceNode[];
  value: string | null;
  onSelect: (listId: string) => void;
}

export interface ListPickerGroup {
  key: string;
  label: string;
  depth: number;
  lists: ListNode[];
}
