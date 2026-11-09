import { SelectVariant } from './select.types';

export interface DateFieldProps {
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  disabled?: boolean;
  variant?: SelectVariant;
  className?: string;
}

export interface DateCalendarProps {
  value: string;
  onSelect: (value: string) => void;
}

export interface CalendarMonth {
  year: number;
  month: number;
}
