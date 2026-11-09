export interface SelectionState {
  ids: string[];
  toggle: (id: string) => void;
  set: (ids: string[]) => void;
  clear: () => void;
}
