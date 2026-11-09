export interface TaskActivityProps {
  taskId: string;
  spaceId?: string;
}

export interface CustomFieldChange {
  fieldId: string;
  name: string | null;
  before: string;
  after: string;
}
