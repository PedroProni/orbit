export interface PickerPerson {
  id: string;
  name: string;
  email?: string;
}

export interface PeoplePickerProps {
  people: PickerPerson[];
  selected: string[];
  onToggle: (id: string) => void;
  label: string;
  meId?: string | null;
  alwaysSearch?: boolean;
}
