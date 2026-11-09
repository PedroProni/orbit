import { TaskPriority } from '@domain/enums/task.enums';
import { TaskCustomFieldValue } from '@domain/types/task-custom-field-value.type';
import { Checklist } from '@domain/types/checklist.type';
import { TaskLinks } from '@domain/types/task-links.type';

export interface UpdateTaskCommand {
  title?: string;
  descriptionMd?: string;
  status?: string;
  priority?: TaskPriority | null;
  tags?: string[];
  addTags?: string[];
  removeTags?: string[];
  assigneeIds?: string[];
  addAssigneeIds?: string[];
  removeAssigneeIds?: string[];
  watcherIds?: string[];
  points?: number | null;
  startDate?: Date | null;
  dueDate?: Date | null;
  customFields?: TaskCustomFieldValue[];
  links?: Partial<TaskLinks>;
  checklists?: Checklist[];
  listId?: string;
  archived?: boolean;
}
