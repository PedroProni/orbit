import { Bold, Code, Heading2, Italic, Link2, List } from 'lucide-react';
import { EditorAction } from './docs.types';

export const EDITOR_ACTIONS: EditorAction[] = [
  { key: 'bold', before: '**', after: '**' },
  { key: 'italic', before: '_', after: '_' },
  { key: 'heading', before: '## ', after: '' },
  { key: 'bullet', before: '- ', after: '' },
  { key: 'code', before: '`', after: '`' },
  { key: 'link', before: '[', after: '](https://)' },
];

export const EDITOR_ICONS = { bold: Bold, italic: Italic, heading: Heading2, bullet: List, code: Code, link: Link2 } as const;
export const DOC_LINK_PARAM = 'doc';
