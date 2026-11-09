// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { makeSpace } from '../helpers/fixtures';
import { ListPicker } from '@/components/tasks/list-picker';
import { useRecentListsStore } from '@/stores/recent-lists.store';

const lists = Array.from({ length: 30 }, (_, index) => ({ id: `l${index}`, name: `Lista ${index}`, kind: 'list', folderId: null }));

describe('ListPicker', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    useRecentListsStore.setState({ listIds: [], hydrated: false });
  });

  it('scrolls the current list into view when it opens', () => {
    const scrolled: Element[] = [];
    Element.prototype.scrollIntoView = vi.fn(function (this: Element) {
      scrolled.push(this);
    });
    renderWithProviders(<ListPicker spaces={[makeSpace({ lists } as never)]} value="l25" onSelect={vi.fn()} />);
    expect(scrolled).toEqual([screen.getByRole('option', { name: 'Lista 25' })]);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
  });
});
