import { TaskKind, TaskPriority } from '@/types/api.types';

export interface TemplateInput {
  spaceId: string;
  name: string;
  titleTemplate: string;
  descriptionMd: string;
  tags: string[];
  priority: TaskPriority | null;
  taskKind: TaskKind;
  estimateMinutes: number | null;
}

export interface TemplateUpdate {
  id: string;
  input: TemplateInput;
}
