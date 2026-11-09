// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, renderHook, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { ReactNode } from 'react';
import en from '../../messages/en.json';
import pt from '../../messages/pt.json';
import { renderWithProviders } from './helpers/render-with-providers';
import { MEMBERS, makeTask } from './helpers/fixtures';
import { StatusChip } from '@/components/tasks/status-chip';
import { TaskTableView } from '@/components/tasks/task-table-view';
import { DashboardWidget } from '@/components/workspace/dashboard-widget';
import { describeApiError } from '@/lib/api-error';
import { useStatusLabel } from '@/hooks/use-status-label';

vi.mock('@/hooks/use-orbit', () => ({ useMembers: () => ({ data: MEMBERS }), useUpdateTask: () => ({ mutate: vi.fn() }) }));

const wrapper = (locale: 'en' | 'pt') =>
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <NextIntlClientProvider locale={locale} messages={locale === 'en' ? en : pt}>
        {children}
      </NextIntlClientProvider>
    );
  };
const labelIn = (locale: 'en' | 'pt') => renderHook(() => useStatusLabel(), { wrapper: wrapper(locale) }).result.current;

describe('status names', () => {
  it.each([
    ['backlog', 'Backlog', 'Backlog'],
    ['to-do', 'A fazer', 'To do'],
    ['stuck', 'Travada', 'Stuck'],
    ['in development', 'Em desenvolvimento', 'In development'],
    ['waiting review', 'Aguardando revisão', 'Waiting review'],
    ['in review', 'Em revisão', 'In review'],
    ['completed', 'Concluída', 'Completed'],
  ])('translates the default status %s', (name, pt, en) => {
    expect(labelIn('pt')(name)).toBe(pt);
    expect(labelIn('en')(name)).toBe(en);
  });

  it('ignores case in a default status', () => {
    expect(labelIn('pt')('TO-DO')).toBe('A fazer');
    expect(labelIn('en')('IN REVIEW')).toBe('In review');
  });

  it('keeps a name an admin created exactly as typed', () => {
    expect(labelIn('pt')('Aguardando QA')).toBe('Aguardando QA');
    expect(labelIn('en')('Aguardando QA')).toBe('Aguardando QA');
  });

  it('renders the translated name in the chip and the table', () => {
    render(<StatusChip status={{ name: 'completed', color: '#22c55e', type: 'done', order: 6 } as never} />, { wrapper: wrapper('pt') });
    expect(screen.getByText('Concluída')).toBeTruthy();
    renderWithProviders(<TaskTableView tasks={[makeTask({ id: 'a', title: 'Alpha', status: 'in review' })]} statusesOf={() => []} readOnly />, 'pt');
    expect(screen.getByText('Em revisão')).toBeTruthy();
    expect(screen.queryByText('in review')).toBeNull();
  });
});

describe('dashboard widget title', () => {
  it('follows the interface language, not the language it was created in', () => {
    renderWithProviders(<DashboardWidget widget={{ id: 'w', type: 'overdue', title: 'Overdue tasks', listId: null, result: { count: 1 } } as never} label={(k) => k} onRemove={() => undefined} />, 'pt');
    expect(screen.getByRole('heading', { name: 'Tarefas atrasadas' })).toBeTruthy();
    expect(screen.queryByText('Overdue tasks')).toBeNull();
  });
});

describe('API refusals', () => {
  it('keeps the rule details the API sent', () => {
    expect(describeApiError(Object.assign(new Error('Title must start with one of: [P4T], [CO]'), { status: 400 }))).toEqual({ key: 'prefix', values: { prefixes: '[P4T], [CO]' } });
    expect(describeApiError(Object.assign(new Error('At least one tag is required: p4t'), { status: 400 }))).toEqual({ key: 'tag', values: { tags: 'p4t' } });
  });

  it.each([
    ['Dependency would create a cycle', 'dependencyCycle'],
    ['A timer is already running', 'timerRunning'],
    ['Unknown user in watchers', 'unknownUser'],
    ['Unknown status for this space', 'unknownStatus'],
  ])('maps %s', (message, key) => {
    expect(describeApiError(Object.assign(new Error(message), { status: 400 })).key).toBe(key);
  });

  it.each([
    [403, 'forbidden'],
    [404, 'notFound'],
    [409, 'conflict'],
    [500, 'generic'],
  ])('falls back by status %i without showing the raw English text', (status, key) => {
    expect(describeApiError(Object.assign(new Error('Some internal detail'), { status }))).toEqual({ key });
  });

  it('survives something that is not an error', () => {
    expect(describeApiError(null)).toEqual({ key: 'generic' });
    expect(describeApiError('boom')).toEqual({ key: 'generic' });
  });

  it('has every refusal in both languages', () => {
    for (const key of ['prefix', 'tag', 'unknownStatus', 'subtaskMove', 'unknownUser', 'subtaskRecurrence', 'dependencyExists', 'dependencyCycle', 'timerRunning', 'timerNotRunning', 'forbidden', 'notFound', 'conflict', 'generic']) {
      expect(en.apiErrors).toHaveProperty(key);
      expect(pt.apiErrors).toHaveProperty(key);
    }
  });
});
