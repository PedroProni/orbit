import { PickerPerson } from './people-picker.types';

export function orderPeople(people: PickerPerson[], query: string, meId: string | null): PickerPerson[] {
  const needle = query.trim().toLowerCase();
  const found = people.filter((person) => person.name.toLowerCase().includes(needle) || (person.email ?? '').toLowerCase().includes(needle));
  const me = found.find((person) => person.id === meId);
  return me ? [me, ...found.filter((person) => person.id !== meId)] : found;
}
