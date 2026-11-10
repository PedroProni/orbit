// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { SearchBox } from '@/components/shell/search-box';

vi.mock('@/hooks/use-orbit', () => ({ useSearch: () => ({ data: undefined }) }));

const stubWidth = (wide: boolean) => {
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: wide && query === '(min-width: 640px)', media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
};

describe('SearchBox', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('shows the short placeholder below sm so it is never cut on a phone', () => {
    stubWidth(false);
    renderWithProviders(<SearchBox />);
    expect(screen.getByRole('textbox', { name: 'Search' }).getAttribute('placeholder')).toBe('Search');
  });

  it('shows the full placeholder from sm up', () => {
    stubWidth(true);
    renderWithProviders(<SearchBox />);
    expect(screen.getByRole('textbox', { name: 'Search' }).getAttribute('placeholder')).toBe('Search tasks and comments');
  });

  it('lets the box shrink inside the header', () => {
    stubWidth(false);
    renderWithProviders(<SearchBox />);
    expect(screen.getByRole('textbox', { name: 'Search' }).parentElement?.className.split(' ')).toContain('min-w-0');
  });
});
