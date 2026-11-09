// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { DateField } from '@/components/ui/date-field';
import { shiftDay, shiftMonth } from '@/components/ui/date-field.helpers';
import { dayFromIso, formatDay, isoFromDay } from '@/lib/calendar-day';

const setup = (locale: 'en' | 'pt' = 'en', value = '2026-11-15', disabled = false) => {
  const onChange = vi.fn();
  renderWithProviders(<DateField value={value} onChange={onChange} ariaLabel="Due" disabled={disabled} />, locale);
  return { onChange, trigger: screen.getByLabelText('Due') };
};

describe('DateField', () => {
  it('shows day first in the Portuguese interface', () => {
    expect(setup('pt').trigger.textContent).toBe('15/11/2026');
  });

  it('shows month first in the English interface', () => {
    expect(setup('en').trigger.textContent).toBe('11/15/2026');
  });

  it('shows the short day with a two digit year in the inline variant, in the interface order', () => {
    const { unmount } = renderWithProviders(<DateField value="2026-11-09" onChange={vi.fn()} ariaLabel="Start" variant="inline" />, 'en');
    expect(screen.getByLabelText('Start').textContent).toBe('11/9/26');
    unmount();
    renderWithProviders(<DateField value="2026-11-09" onChange={vi.fn()} ariaLabel="Start" variant="inline" />, 'pt');
    expect(screen.getByLabelText('Start').textContent).toBe('09/11/26');
  });

  it('says there is no date in the interface language', () => {
    expect(setup('pt', '').trigger.textContent).toBe('Sem data');
  });

  it('names the months and the actions in the interface language', () => {
    fireEvent.click(setup('pt').trigger);
    expect(screen.getByRole('grid').getAttribute('aria-label')).toBe('novembro de 2026');
    expect(screen.getByRole('button', { name: 'Limpar data' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Próximo mês' })).toBeTruthy();
  });

  it('reports the chosen day and closes', () => {
    const { trigger, onChange } = setup();
    fireEvent.click(trigger);
    fireEvent.click(document.querySelector('[data-day="2026-11-20"]') as HTMLElement);
    expect(onChange).toHaveBeenCalledWith('2026-11-20');
    expect(screen.queryByRole('grid')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('clears the date', () => {
    const { trigger, onChange } = setup();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: 'Clear date' }));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('offers no clear action without a date', () => {
    fireEvent.click(setup('en', '').trigger);
    expect(screen.queryByRole('button', { name: 'Clear date' })).toBeNull();
  });

  it('closes on Escape without changing anything', () => {
    const { trigger, onChange } = setup();
    fireEvent.click(trigger);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('grid')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('moves the focused day with the arrow keys across months', () => {
    const { trigger } = setup('en', '2026-11-30');
    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole('grid'), { key: 'ArrowRight' });
    expect(screen.getByRole('grid').getAttribute('aria-label')).toBe('December 2026');
    expect(document.activeElement?.getAttribute('data-day')).toBe('2026-12-01');
  });

  it('cannot be opened when disabled', () => {
    const { trigger } = setup('en', '2026-11-15', true);
    fireEvent.click(trigger);
    expect(screen.queryByRole('grid')).toBeNull();
  });
});

describe('date helpers', () => {
  it('keeps the same day whatever the time zone of the machine', () => {
    expect(formatDay('2026-01-01', 'pt')).toBe('01/01/2026');
    expect(isoFromDay('2026-01-01')).toBe('2026-01-01T12:00:00.000Z');
    expect(dayFromIso('2026-01-01T12:00:00.000Z')).toBe('2026-01-01');
  });

  it('handles empty values', () => {
    expect(isoFromDay('')).toBeNull();
    expect(dayFromIso(null)).toBe('');
  });

  it('crosses year boundaries', () => {
    expect(shiftDay('2026-12-31', 1)).toBe('2027-01-01');
    expect(shiftMonth({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 });
  });
});
