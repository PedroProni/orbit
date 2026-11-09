import { SpaceNode } from '@/types/api.types';
import { TaskTemplate } from '@/types/workspace.types';
import { ComposerFieldLook, ComposerPicker } from './composer-field.types';
import { PickerPerson } from './people-picker.types';
import { ComposerDraft } from './task-composer.types';

export type ComposerFieldName = 'template' | 'people' | 'date' | 'priority' | 'tags' | 'kind' | 'fields' | 'points';

export interface ComposerFieldsProps {
  names: ComposerFieldName[];
  look: ComposerFieldLook;
  draft: ComposerDraft;
  space: SpaceNode;
  people: PickerPerson[];
  meId: string | null;
  suggestions: string[];
  picker: string | null;
  onToggle: (picker: ComposerPicker) => void;
  onClose: () => void;
  onChange: (draft: Partial<ComposerDraft>) => void;
  onTemplate?: (template: TaskTemplate) => void;
}
