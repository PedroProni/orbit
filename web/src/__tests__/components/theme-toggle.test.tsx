// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { DARK_CLASS, THEME_INIT_SCRIPT, THEME_STORAGE_KEY } from '@/config/theme.constants';

const root = document.documentElement;
const runInitScript = () => new Function(THEME_INIT_SCRIPT)();
const settle = () => act(async () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear();
    root.classList.add(DARK_CLASS);
    vi.restoreAllMocks();
  });

  it('keeps dark when nothing is stored', () => {
    runInitScript();
    expect(root.classList.contains(DARK_CLASS)).toBe(true);
  });

  it('restores a stored light theme before the first paint', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    runInitScript();
    expect(root.classList.contains(DARK_CLASS)).toBe(false);
  });

  it('keeps dark for an unknown stored value', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'neon');
    runInitScript();
    expect(root.classList.contains(DARK_CLASS)).toBe(true);
  });

  it('does not break when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(runInitScript).not.toThrow();
    expect(root.classList.contains(DARK_CLASS)).toBe(true);
  });

  it('switches and persists both ways, and the choice survives a reload', async () => {
    renderWithProviders(<ThemeToggle />);
    await settle();
    fireEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }));
    expect(root.classList.contains(DARK_CLASS)).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    root.classList.add(DARK_CLASS);
    runInitScript();
    expect(root.classList.contains(DARK_CLASS)).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Switch to dark theme' }));
    expect(root.classList.contains(DARK_CLASS)).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('labels the switch in the interface language', async () => {
    renderWithProviders(<ThemeToggle />, 'pt');
    await settle();
    expect(screen.getByRole('button', { name: 'Mudar para o tema claro' })).toBeTruthy();
  });

  it('still switches when saving the choice fails', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    renderWithProviders(<ThemeToggle />);
    await settle();
    fireEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }));
    expect(root.classList.contains(DARK_CLASS)).toBe(false);
  });
});
