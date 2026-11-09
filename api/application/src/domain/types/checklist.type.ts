export interface ChecklistItem {
  id: string;
  name: string;
  resolved: boolean;
  assigneeId: string | null;
}

export interface Checklist {
  id: string;
  name: string;
  items: ChecklistItem[];
}
