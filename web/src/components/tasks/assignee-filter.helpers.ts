import { AssigneeCounts, Member } from '@/types/api.types';
import { AssigneeRow } from './assignee-filter.types';

export const assigneeRows = (members: Member[], meId: string | undefined, counts: AssigneeCounts | undefined, selected: string[], query: string): AssigneeRow[] => {
  const needle = query.trim().toLowerCase();
  const countOf = (id: string) => (counts ? (counts.byAssignee.find((item) => item.assigneeId === id)?.count ?? 0) : null);
  return members
    .filter((member) => member.role !== 'guest' && (member.status === 'active' || selected.includes(member.id)))
    .filter((member) => !needle || member.name.toLowerCase().includes(needle) || member.email.toLowerCase().includes(needle))
    .map((member) => ({ member, count: countOf(member.id), me: member.id === meId }))
    .sort((a, b) => Number(b.me) - Number(a.me) || (b.count ?? 0) - (a.count ?? 0) || a.member.name.localeCompare(b.member.name));
};
