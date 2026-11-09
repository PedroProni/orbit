import { DocSummary } from '@/types/workspace.types';
import { DocTreeNode } from './docs.types';

export const buildDocTree = (docs: DocSummary[]): DocTreeNode[] => {
  const nodes = new Map<string, DocTreeNode>(docs.map((d) => [d.id, { ...d, children: [] }]));
  const roots: DocTreeNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    (parent ? parent.children : roots).push(node);
  }
  return roots;
};

export const wrapSelection = (value: string, start: number, end: number, before: string, after: string): { value: string; cursor: number } => {
  const selected = value.slice(start, end);
  return { value: `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`, cursor: start + before.length + selected.length };
};
