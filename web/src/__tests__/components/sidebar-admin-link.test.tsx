// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { adminSpace } from '../helpers/admin-fixtures';
import { Sidebar } from '@/components/shell/sidebar';
import { capabilitiesOf } from '@/lib/capabilities';
import { adminService } from '@/services/admin.service';
import { FolderNode, Principal } from '@/types/api.types';

const mocks = vi.hoisted(() => ({ role: 'owner' }));

vi.mock('next/navigation', () => ({ useParams: () => ({}) }));
vi.mock('@/hooks/use-orbit', () => ({
  useHierarchy: () => ({ isLoading: false, data: [adminSpace()] }),
  useMe: () => ({ data: { name: 'Pessoa' } }),
}));
vi.mock('@/hooks/use-capabilities', () => ({
  useCapabilities: () => capabilitiesOf({ role: mocks.role } as Principal),
}));

describe('Sidebar access to the administration area', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it.each(['owner', 'admin'])('shows the Administration link and the create buttons to %s', (role) => {
    mocks.role = role;
    renderWithProviders(<Sidebar />);
    expect(screen.getByRole('link', { name: 'Administration' }).getAttribute('href')).toBe('/admin/general');
    expect(screen.getByRole('button', { name: 'New space' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Create in Engineering' })).toBeTruthy();
  });

  it.each(['member', 'guest'])('hides the Administration link and the create buttons from %s', (role) => {
    mocks.role = role;
    renderWithProviders(<Sidebar />);
    expect(screen.queryByRole('link', { name: 'Administration' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'New space' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Create in Engineering' })).toBeNull();
  });

  it('creates a folder from the space menu', async () => {
    mocks.role = 'admin';
    const create = vi.spyOn(adminService, 'createFolder').mockResolvedValue({ id: 'f2' } as FolderNode);
    renderWithProviders(<Sidebar />);
    fireEvent.click(screen.getByRole('button', { name: 'Create in Engineering' }));
    fireEvent.click(
      within(screen.getByRole('menu')).getByRole('menuitem', {
        name: 'New folder',
      }),
    );
    const dialog = screen.getByRole('dialog', { name: 'New folder' });
    fireEvent.change(within(dialog).getByLabelText('Name'), {
      target: { value: 'Q1' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(create).toHaveBeenCalledWith('s1', 'Q1'));
  });

  it('keeps the work links for a member', () => {
    mocks.role = 'member';
    renderWithProviders(<Sidebar />);
    expect(screen.getByRole('link', { name: 'Inbox' })).toBeTruthy();
  });

  it('hides the work links from a guest', () => {
    mocks.role = 'guest';
    renderWithProviders(<Sidebar />);
    expect(screen.queryByRole('link', { name: 'Inbox' })).toBeNull();
  });
});
