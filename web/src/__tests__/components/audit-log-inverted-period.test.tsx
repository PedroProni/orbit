// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { adminSpace, principal } from '../helpers/admin-fixtures';
import { MEMBERS, resetUiStore } from '../helpers/fixtures';
import { AdminShell } from '@/components/admin/admin-shell';
import { AuditLogAdminPage } from '@/components/admin/audit-log-admin-page';
import { auditService } from '@/services/audit.service';
import { AuditLogItem } from '@/services/audit.types';
import { orbitService } from '@/services/orbit.service';
import { useSessionStore } from '@/stores/session.store';

vi.mock('next/navigation', () => ({ usePathname: () => '/admin/audit-log', useParams: () => ({}), useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));

const ROW: AuditLogItem = {
  id: 'a1',
  createdAt: '2026-11-09T12:00:00.000Z',
  action: 'task.updated',
  actor: { type: 'user', id: 'u1', name: 'Ana Souza', deleted: false },
  entity: { type: 'task', id: 't1', label: 'Corrigir login', deleted: false },
  meta: { changed: ['title'] },
};

describe('audit log with an inverted period', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetUiStore();
    useSessionStore.setState({ authenticated: true, hydrated: true });
    vi.spyOn(orbitService, 'me').mockResolvedValue(principal('admin'));
    vi.spyOn(orbitService, 'hierarchy').mockResolvedValue([adminSpace()]);
    vi.spyOn(orbitService, 'members').mockResolvedValue(MEMBERS);
  });
  afterEach(() => cleanup());

  it('hides the previous rows and Load more while the period is inverted and brings them back once fixed', async () => {
    vi.spyOn(auditService, 'list').mockResolvedValue({ items: [ROW], nextCursor: 'c-2' });
    renderWithProviders(
      <AdminShell>
        <AuditLogAdminPage />
      </AdminShell>,
    );
    expect(await screen.findByText('Corrigir login')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Load more' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-11-09' } });
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-11-01' } });
    expect((await screen.findByRole('alert')).textContent).toBe('The start date must be on or before the end date.');
    expect(screen.queryByText('Corrigir login')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull();
    expect(screen.queryByRole('region', { name: 'Audit log' })).toBeNull();
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-11-10' } });
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
    expect(await screen.findByText('Corrigir login')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Load more' })).toBeTruthy();
  });
});
