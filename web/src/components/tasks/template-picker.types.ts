import { TaskTemplate } from '@/types/workspace.types';

export interface TemplatePickerProps {
  spaceId: string;
  onPick: (template: TaskTemplate) => void;
}
