import { SpaceNode } from '@/types/api.types';
import { ComposerDraft } from './task-composer.types';

export interface ComposerRuleHintsProps {
  space: SpaceNode;
  draft: ComposerDraft;
  onChange: (draft: Partial<ComposerDraft>) => void;
  onFocus: () => void;
}
