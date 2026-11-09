import { DocSummary } from '@/types/workspace.types';

export interface DocTreeNode extends DocSummary {
  children: DocTreeNode[];
}

export interface EditorAction {
  key: 'bold' | 'italic' | 'heading' | 'bullet' | 'code' | 'link';
  before: string;
  after: string;
}
