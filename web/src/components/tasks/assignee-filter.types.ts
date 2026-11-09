import { Member } from '@/types/api.types';

export interface AssigneeFilterProps {
  listId: string | null;
}

export interface AssigneeRow {
  member: Member;
  count: number | null;
  me: boolean;
}
