// @vitest-environment jsdom
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { DocsScreen } from '@/components/workspace/docs-screen';
import { DocTree } from '@/components/workspace/doc-tree';
import { DocEditor } from '@/components/workspace/doc-editor';
import { buildDocTree } from '@/components/workspace/docs.helpers';
import { workspaceService } from '@/services/workspace.service';
import { DocSummary } from '@/types/workspace.types';

const nav = vi.hoisted(() => ({ params: new URLSearchParams() }));

vi.mock('next/navigation', () => ({
  useSearchParams: () => nav.params,
}));

vi.mock('@/services/workspace.service', () => ({
  workspaceService: { createDoc: vi.fn(), saveDoc: vi.fn(), archiveDoc: vi.fn() },
}));

const docs = vi.hoisted(() => ({
  list: [
    { id: 'a', title: 'Handbook', spaceId: null, parentId: null, updatedAt: '2026-01-01T00:00:00Z' },
    { id: 'b', title: 'Setup', spaceId: null, parentId: 'a', updatedAt: '2026-01-01T00:00:00Z' },
    { id: 'c', title: 'Glossary', spaceId: null, parentId: null, updatedAt: '2026-01-01T00:00:00Z' },
  ] as DocSummary[],
}));

vi.mock('@/hooks/use-workspace', () => ({
  useDocs: () => ({ data: docs.list }),
  useDoc: (id: string | null) => ({ data: id ? { id, title: 'Handbook', bodyMd: 'hello', spaceId: null, parentId: null, updatedAt: '2026-01-01T00:00:00Z' } : undefined }),
  useInvalidating: (fn: (args: unknown) => unknown) => ({ mutate: (args: unknown) => fn(args), isPending: false }),
}));

function Harness({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  return <DocEditor value={value} onChange={setValue} />;
}

describe('DocTree', () => {
  it('nests child docs under their parent', () => {
    renderWithProviders(<DocTree nodes={buildDocTree(docs.list)} selected={null} onSelect={vi.fn()} onAddChild={vi.fn()} />);
    const parent = screen.getByText('Handbook').closest('li') as HTMLElement;
    expect(parent.contains(screen.getByText('Setup'))).toBe(true);
    expect(parent.contains(screen.getByText('Glossary'))).toBe(false);
  });

  it('collapses and expands the children from the toggle button', () => {
    renderWithProviders(<DocTree nodes={buildDocTree(docs.list)} selected={null} onSelect={vi.fn()} onAddChild={vi.fn()} />);
    fireEvent.click(screen.getAllByLabelText('Expand or collapse')[0]);
    expect(screen.queryByText('Setup')).toBeNull();
    fireEvent.click(screen.getAllByLabelText('Expand or collapse')[0]);
    expect(screen.getByText('Setup')).toBeTruthy();
  });

  it('reports selection and add subpage with the node id', () => {
    const onSelect = vi.fn();
    const onAddChild = vi.fn();
    renderWithProviders(<DocTree nodes={buildDocTree(docs.list)} selected={null} onSelect={onSelect} onAddChild={onAddChild} />);
    fireEvent.click(screen.getByText('Setup'));
    fireEvent.click(screen.getAllByLabelText('Add subpage')[2]);
    expect(onSelect).toHaveBeenCalledWith('b');
    expect(onAddChild).toHaveBeenCalledWith('c');
  });
});

describe('DocsScreen', () => {
  beforeEach(() => vi.clearAllMocks());

  it('asks to pick a doc before one is selected', () => {
    renderWithProviders(<DocsScreen />);
    expect(screen.getByText('Pick or create a doc')).toBeTruthy();
  });

  it('creates a subpage with the parent id', () => {
    renderWithProviders(<DocsScreen />);
    fireEvent.click(screen.getAllByLabelText('Add subpage')[0]);
    expect(workspaceService.createDoc).toHaveBeenCalledWith({ title: 'Untitled', bodyMd: '', parentId: 'a' });
  });

  it('opens the doc from a ?doc= link and drops the parameter from the address', async () => {
    window.history.replaceState(null, '', '/docs?doc=c&x=1');
    nav.params = new URLSearchParams('doc=c&x=1');
    renderWithProviders(<DocsScreen />);
    await waitFor(() => expect(screen.queryByText('Pick or create a doc')).toBeNull());
    expect(window.location.search).toBe('?x=1');
    nav.params = new URLSearchParams();
    window.history.replaceState(null, '', '/');
  });

  it('opens a doc linked after the screen is already showing', async () => {
    const view = renderWithProviders(<DocsScreen />);
    expect(screen.getByText('Pick or create a doc')).toBeTruthy();
    window.history.replaceState(null, '', '/docs?doc=c');
    nav.params = new URLSearchParams('doc=c');
    view.rerender(<DocsScreen />);
    await waitFor(() => expect(screen.queryByText('Pick or create a doc')).toBeNull());
    expect(window.location.search).toBe('');
    nav.params = new URLSearchParams();
    window.history.replaceState(null, '', '/');
  });

  it('creates a root doc without a parent', () => {
    renderWithProviders(<DocsScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'New doc' }));
    expect(workspaceService.createDoc).toHaveBeenCalledWith({ title: 'Untitled', bodyMd: '' });
  });
});

describe('DocEditor', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', (cb: () => void) => {
      cb();
      return 0;
    });
  });

  it('wraps the selected text with bold markers from the toolbar', () => {
    renderWithProviders(<Harness initial="hello world" />);
    const area = screen.getByLabelText('Doc content') as HTMLTextAreaElement;
    area.setSelectionRange(0, 5);
    fireEvent.click(screen.getByRole('button', { name: 'Bold' }));
    expect(area.value).toBe('**hello** world');
  });

  it('prefixes the heading marker at the cursor', () => {
    renderWithProviders(<Harness initial="title" />);
    const area = screen.getByLabelText('Doc content') as HTMLTextAreaElement;
    area.setSelectionRange(0, 0);
    fireEvent.click(screen.getByRole('button', { name: 'Heading' }));
    expect(area.value).toBe('## title');
  });
});
