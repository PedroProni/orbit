import { UserRole } from '@/types/api.types';

export interface PickerPerson {
  id: string;
  name: string;
  email?: string;
  role?: UserRole;
}

export interface PeoplePickerProps {
  people: PickerPerson[];
  selected: string[];
  onToggle: (id: string) => void;
  label: string;
  meId?: string | null;
  alwaysSearch?: boolean;
}
