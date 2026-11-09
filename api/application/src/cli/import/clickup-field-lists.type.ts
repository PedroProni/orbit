import { TaskLinkKey } from '@domain/types/task-link-key.type';
import { TaskLinks } from '@domain/types/task-links.type';

export interface ClickupListField {
  id: string | number;
  name?: string;
  type?: string;
}

export interface CollectedField {
  raw: any;
  spaceId: string;
  listIds: Set<string>;
}

export interface StoredListRow {
  _id: string;
  space_id: string;
}

export interface StoredFieldDefinitionRow {
  _id: string;
  space_id: string;
  list_ids?: string[] | null;
}

export interface StoredTaskListRef {
  list_id?: string | null;
}

export interface FieldListsSummary {
  definitions: number;
  spaceWideBefore: number;
  scopedBefore: number;
  spaceWideAfter: number;
  scopedAfter: number;
  updated: number;
  listsRead: number;
  listsFailed: number;
}

export interface FieldAliasMismatch {
  fieldId: string;
  name: string;
  link: TaskLinkKey;
}

export interface StoredTaskLinksRow {
  _id: string;
  links?: Partial<TaskLinks> | null;
}
