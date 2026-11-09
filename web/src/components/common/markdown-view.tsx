'use client';

import { useMemo } from 'react';
import { renderMarkdown } from '@/lib/markdown';
import { MarkdownViewProps } from './markdown-view.types';

export function MarkdownView({ source, className }: MarkdownViewProps) {
  const html = useMemo(() => renderMarkdown(source), [source]);
  return <div className={`md-body text-sm ${className ?? ''}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
