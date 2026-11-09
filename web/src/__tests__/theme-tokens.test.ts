import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8');
const blockOf = (selector: string): Record<string, string> => {
  const start = css.indexOf(`${selector} {`);
  const body = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
};
const light = blockOf(':root');
const dark = blockOf('.dark');
const channel = (v: number): number => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex: string): number => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};
const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const SURFACES = ['bg', 'panel', 'panel-2'];
const THEMES = [['light', light], ['dark', dark]] as const;

describe('theme tokens', () => {
  it('keeps a disabled accent button readable in the light theme', () => {
    const start = css.indexOf(':root:not(.dark) button.bg-accent:disabled {');
    expect(start).toBeGreaterThan(-1);
    const body = css.slice(start, css.indexOf('}', start));
    expect(body).toContain('background: var(--panel-2)');
    expect(body).toContain('color: var(--muted)');
    expect(contrast(light.muted, light['panel-2'])).toBeGreaterThanOrEqual(4.5);
  });

  it('defines every color token in the dark theme too', () => {
    const shared = Object.keys(light).filter((k) => !k.startsWith('motion') && !k.startsWith('ease') && !k.endsWith('-font'));
    expect(Object.keys(dark).sort()).toEqual(shared.sort());
  });

  it.each(THEMES)('%s: body text reaches 4.5:1 on every surface', (_name, theme) => {
    for (const surface of SURFACES) {
      expect(contrast(theme.text, theme[surface])).toBeGreaterThanOrEqual(4.5);
      expect(contrast(theme.muted, theme[surface])).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each(THEMES)('%s: faint text and status colors reach 3:1 on every surface', (_name, theme) => {
    for (const surface of SURFACES) {
      for (const token of ['faint', 'danger', 'accent', 'status-todo', 'status-progress', 'status-review', 'status-done', 'status-cancelled', 'priority-urgent', 'priority-high', 'priority-normal', 'priority-low']) {
        expect(contrast(theme[token], theme[surface]), `${token} on ${surface}`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('light: status and priority text reaches 4.5:1 on the panel', () => {
    for (const token of ['danger', 'status-todo', 'status-progress', 'status-review', 'status-done', 'priority-urgent', 'priority-high', 'priority-normal', 'priority-low']) {
      expect(contrast(light[token], light.panel), token).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('white text on the accent button stays readable', () => {
    expect(contrast('#ffffff', light.accent)).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#ffffff', dark.accent)).toBeGreaterThanOrEqual(3);
  });
});
