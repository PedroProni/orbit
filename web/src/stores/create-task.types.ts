export interface CreateTaskDefaults {
  listId: string | null;
  status?: string;
}

export interface CreateTaskState {
  open: boolean;
  session: number;
  defaults: CreateTaskDefaults;
  show: (defaults: CreateTaskDefaults) => void;
  hide: () => void;
}
