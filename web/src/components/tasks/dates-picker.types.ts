export type DateShortcut = 'today' | 'tomorrow' | 'thisWeekend' | 'nextWeek' | 'nextWeekend' | 'twoWeeks' | 'fourWeeks';

export type DateSide = 'start' | 'due';

export interface DatesValue {
  startDate: string;
  dueDate: string;
}

export interface DatesPickerProps {
  value: DatesValue;
  onChange: (value: DatesValue) => void;
  onDone: () => void;
}
