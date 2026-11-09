'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import { DocTreeNode } from './docs.types';

export function DocTree({ nodes, selected, onSelect, onAddChild, level = 0 }: { nodes: DocTreeNode[]; selected: string | null; onSelect: (id: string) => void; onAddChild: (parentId: string) => void; level?: number }) {
  const t = useTranslations('docs');
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  return (
    <ul className="space-y-0.5">
      {nodes.map((node) => (
        <li key={node.id}>
          <div className={cn('group flex items-center gap-1 rounded pr-1 text-sm', node.id === selected ? 'bg-accentsoft' : 'hover:bg-panel2')} style={{ paddingLeft: level * 12 + 4 }}>
            <button type="button" aria-label={t('toggle')} onClick={() => setClosed((c) => ({ ...c, [node.id]: !c[node.id] }))} className={cn('text-muted', node.children.length === 0 && 'invisible')}>
              {closed[node.id] ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
            </button>
            <FileText size={13} className="shrink-0 text-muted" />
            <button type="button" onClick={() => onSelect(node.id)} className="min-w-0 flex-1 truncate py-1 text-left">
              {node.title}
            </button>
            <button type="button" aria-label={t('addSubpage')} onClick={() => onAddChild(node.id)} className="invisible text-muted hover:text-fg group-hover:visible">
              <Plus size={13} />
            </button>
          </div>
          {node.children.length > 0 && !closed[node.id] ? <DocTree nodes={node.children} selected={selected} onSelect={onSelect} onAddChild={onAddChild} level={level + 1} /> : null}
        </li>
      ))}
    </ul>
  );
}
