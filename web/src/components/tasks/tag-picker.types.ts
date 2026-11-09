export interface TagPickerProps {
  selected: string[];
  suggestions: string[];
  onToggle: (tag: string) => void;
  label: string;
}
