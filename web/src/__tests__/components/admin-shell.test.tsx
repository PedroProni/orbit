// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { principal } from '../helpers/admin-fixtures';
import { AdminShell } from '@/components/admin/admin-shell';
import { GroupsAdminPage } from '@/components/admin/groups-admin-page';
import { TaskTypesAdminPage } from '@/components/admin/task-types-admin-page';
import { adminService } from '@/services/admin.service';
import { orbitService } from '@/services/orbit.service';
import { useSessionStore } from '@/stores/session.store';

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/task-types',
  useParams: () => ({}),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

describe('administration area', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useSessionStore.setState({ authenticated: true, hydrated: true });
  });
  afterEach(() => cleanup());

  it.each(['member', 'guest'])('refuses a %s opening it by URL and sends no administrative call', async (role) => {
    vi.spyOn(orbitService, 'me').mockResolvedValue(principal(role));
    const groups = vi.spyOn(adminService, 'groups').mockResolvedValue([]);
    renderWithProviders(
      <AdminShell>
        <GroupsAdminPage />
      </AdminShell>,
    );
    expect(await screen.findByText('You do not have access to this page')).toBeTruthy();
    expect(screen.getByText('Only owners and administrators open the administration area.')).toBeTruthy();
    expect(screen.queryByRole('navigation', { name: 'Administration sections' })).toBeNull();
    expect(groups).not.toHaveBeenCalled();
  });

  it.each(['owner', 'admin'])('opens for %s with the sections grouped and the current one marked', async (role) => {
    vi.spyOn(orbitService, 'me').mockResolvedValue(principal(role));
    renderWithProviders(
      <AdminShell>
        <TaskTypesAdminPage />
      </AdminShell>,
    );
    const nav = await screen.findByRole('navigation', {
      name: 'Administration sections',
    });
    expect(nav.textContent).toContain('People');
    expect(nav.textContent).toContain('Structure');
    expect(screen.getByRole('link', { name: 'Spaces, folders and lists' }).getAttribute('href')).toBe('/admin/spaces');
    expect(screen.getByRole('link', { name: 'Task types' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByText('Bug')).toBeTruthy();
    expect(screen.getByText('Something broken that needs a fix.')).toBeTruthy();
  });

  it('shows the area in Portuguese', async () => {
    vi.spyOn(orbitService, 'me').mockResolvedValue(principal('admin'));
    renderWithProviders(
      <AdminShell>
        <TaskTypesAdminPage />
      </AdminShell>,
      'pt',
    );
    expect(
      await screen.findByRole('navigation', {
        name: 'Seções da administração',
      }),
    ).toBeTruthy();
  });
});
