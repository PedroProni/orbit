import { TaskPriority } from '@domain/enums/task.enums';
import { TaskKind } from '@domain/enums/task-kind.enums';
import { TaskCustomFieldValue } from '@domain/types/task-custom-field-value.type';

export interface CreateTaskCommand {
  listId: string;
  parentId: string | null;
  title: string;
  descriptionMd: string;
  status: string | null;
  priority: TaskPriority | null;
  tags: string[];
  assigneeIds: string[];
  watcherIds: string[];
  points: number | null;
  startDate: Date | null;
  dueDate: Date | null;
  customFields: TaskCustomFieldValue[];
  taskKind: TaskKind | null;
}
