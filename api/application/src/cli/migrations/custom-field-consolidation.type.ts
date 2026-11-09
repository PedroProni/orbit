import { CustomFieldType } from '@domain/enums/custom-field.enums';
import { CustomFieldOption } from '@domain/types/custom-field-option.type';
import { TaskCustomFieldValue } from '@domain/types/task-custom-field-value.type';
import { TaskLinkKey } from '@domain/types/task-link-key.type';
import { TaskLinks } from '@domain/types/task-links.type';

export interface FieldDefinitionDoc {
  _id: string;
  workspace_id: string;
  space_id: string;
  name: string;
  type: CustomFieldType;
  options: CustomFieldOption[];
  list_ids?: string[] | null;
  created_at: Date;
  updated_at: Date;
}

export interface FieldTaskDoc {
  _id: string;
  workspace_id: string;
  space_id: string;
  custom_fields: TaskCustomFieldValue[];
  links?: Partial<TaskLinks> | null;
}

export type FieldRemovalReason = 'link' | 'removed';

export interface PlannedFieldRemoval {
  id: string;
  workspaceId: string;
  spaceId: string;
  name: string;
  reason: FieldRemovalReason;
  into: TaskLinkKey | null;
}

export interface TaskFieldState {
  customFields: TaskCustomFieldValue[];
  links: TaskLinks;
}

export interface PlannedTaskFieldChange {
  id: string;
  workspaceId: string;
  before: TaskFieldState;
  after: TaskFieldState;
}

export interface FieldValueConflict {
  taskId: string;
  link: TaskLinkKey;
  kept: string;
  dropped: string;
  fromField: string;
}

export interface FieldTypeMismatch {
  fieldId: string;
  name: string;
  type: CustomFieldType;
  link: TaskLinkKey;
}

export interface BackedUpFieldValue {
  taskId: string;
  fieldId: string;
  fieldName: string;
  value: string | number;
  reason: FieldRemovalReason;
}

export interface CustomFieldConsolidationPlan {
  remove: PlannedFieldRemoval[];
  tasks: PlannedTaskFieldChange[];
  conflicts: FieldValueConflict[];
  typeMismatches: FieldTypeMismatch[];
  backedUpValues: BackedUpFieldValue[];
  valuesBefore: Record<string, number>;
  linksAfter: Record<TaskLinkKey, number>;
}

export interface FieldAuditDoc {
  _id: string;
  workspace_id: string;
  actor_type: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  meta: Record<string, unknown> & { migration: string; diff?: Record<string, { before: unknown; after: unknown }> };
  created_at: Date;
  updated_at: Date;
}
