import { UserRole } from '@/types/api.types';

export function assignablePeople<T extends { id: string; role?: UserRole }>(people: T[], selected: string[] = []): T[] {
  return people.filter((person) => person.role !== 'viewer' || selected.includes(person.id));
}
