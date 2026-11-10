import { TaskKind, TaskPriority, SpaceNode } from '@/types/api.types';
import { TaskTemplate } from '@/types/workspace.types';
import { TemplateInput } from '@/services/template.types';

export interface TemplateDraft {
  spaceId: string;
  name: string;
  titleTemplate: string;
  descriptionMd: string;
  tags: string;
  priority: TaskPriority | '';
  taskKind: TaskKind;
  estimate: string;
}

export type TemplateProblem = 'space' | 'name' | 'title' | 'estimate';

export interface TemplateRowProps {
  template: TaskTemplate;
  spaceName: string | null;
  onEdit: (template: TaskTemplate) => void;
  onDelete: (template: TaskTemplate) => void;
}

export interface TemplateDialogProps {
  open: boolean;
  template: TaskTemplate | null;
  spaces: SpaceNode[];
  onSubmit: (input: TemplateInput) => Promise<unknown>;
  onClose: () => void;
}
