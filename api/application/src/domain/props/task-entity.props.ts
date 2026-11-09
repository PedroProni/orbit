import { TaskLinks } from '@domain/types/task-links.type';
import { TaskPriority } from '@domain/enums/task.enums';
import { TaskCustomFieldValue } from '@domain/types/task-custom-field-value.type';
import { Checklist } from '@domain/types/checklist.type';

export interface TaskEntityProps {
  _id: string;
  workspaceId: string;
  spaceId: string;
  listId: string;
  parentId: string | null;
  title: string;
  descriptionMd: string;
  status: string;
  priority: TaskPriority | null;
  tags: string[];
  assigneeIds: string[];
  watcherIds: string[];
  points: number | null;
  startDate: Date | null;
  dueDate: Date | null;
  customFields: TaskCustomFieldValue[];
  links: TaskLinks;
  checklists: Checklist[];
  creatorId: string;
  dateClosed: Date | null;
  archived: boolean;
  clickupId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
