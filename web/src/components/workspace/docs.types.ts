import { DocSummary } from '@/types/workspace.types';

export interface DocTreeNode extends DocSummary {
  children: DocTreeNode[];
}

export interface DocEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export interface DocTreeProps {
  nodes: DocTreeNode[];
  selected: string | null;
  onSelect: (id: string) => void;
  onAddChild?: (parentId: string) => void;
  level?: number;
}

export interface EditorAction {
  key: 'bold' | 'italic' | 'heading' | 'bullet' | 'code' | 'link';
  before: string;
  after: string;
}
