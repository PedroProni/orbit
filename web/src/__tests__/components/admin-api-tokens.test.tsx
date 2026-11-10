// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { adminSpace, principal } from '../helpers/admin-fixtures';
import { MEMBERS } from '../helpers/fixtures';
import { AdminShell } from '@/components/admin/admin-shell';
import { ApiTokensAdminPage } from '@/components/admin/api-tokens-admin-page';
import { apiTokenService } from '@/services/api-token.service';
import { ApiToken } from '@/services/api-token.types';
import { orbitService } from '@/services/orbit.service';
import { useSessionStore } from '@/stores/session.store';
import { Principal } from '@/types/api.types';

vi.mock('next/navigation', () => ({ usePathname: () => '/admin/api-tokens', useParams: () => ({}), useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));

const ADMIN_SCOPES = ['workspace:read', 'tasks:read', 'tasks:write', 'structure:write', 'tokens:manage'];
const withScopes = (role: string, scopes: string[]): Principal => ({ ...principal(role), scopes }) as Principal;

const token = (over: Partial<ApiToken>): ApiToken => ({ id: 'k1', userId: 'u1', name: 'Integração CI', scopes: ['tasks:read'], lastUsedAt: null, revokedAt: null, createdAt: '2026-11-01T10:00:00.000Z', ...over });
const ACTIVE = token({});
const USED = token({ id: 'k2', userId: 'u2', name: 'Relatórios', scopes: ['workspace:read', 'tasks:write'], lastUsedAt: '2026-11-08T10:00:00.000Z' });
const REVOKED = token({ id: 'k3', userId: 'u2', name: 'Antigo', revokedAt: '2026-11-05T10:00:00.000Z' });

const rowOf = (name: string) => screen.getByText(name, { selector: 'p' }).closest('li') as HTMLElement;
const dialog = () => screen.getByRole('dialog');

const setup = async (list: ApiToken[] = [ACTIVE, USED, REVOKED]) => {
  vi.spyOn(apiTokenService, 'list').mockResolvedValue(list);
  renderWithProviders(
    <AdminShell>
      <ApiTokensAdminPage />
    </AdminShell>,
  );
  if (list.length) await screen.findByText(list[0].name, { selector: 'p' });
};

describe('API tokens administration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useSessionStore.setState({ authenticated: true, hydrated: true });
    vi.spyOn(orbitService, 'me').mockResolvedValue(withScopes('admin', ADMIN_SCOPES));
    vi.spyOn(orbitService, 'hierarchy').mockResolvedValue([adminSpace()]);
    vi.spyOn(orbitService, 'members').mockResolvedValue(MEMBERS);
  });
  afterEach(() => cleanup());

  it.each(['member', 'viewer', 'guest'])('refuses a %s and never asks for the tokens', async (role) => {
    vi.spyOn(orbitService, 'me').mockResolvedValue(principal(role));
    const list = vi.spyOn(apiTokenService, 'list').mockResolvedValue([ACTIVE]);
    renderWithProviders(
      <AdminShell>
        <ApiTokensAdminPage />
      </AdminShell>,
    );
    expect(await screen.findByText('You do not have access to this page')).toBeTruthy();
    expect(list).not.toHaveBeenCalled();
  });

  it('shows an admin its tokens without owner lines, with status, use and translated permissions', async () => {
    await setup();
    expect(screen.getByText(/A token never does more than your current role allows/)).toBeTruthy();
    expect(screen.queryByText(/^Owner:/)).toBeNull();
    expect(within(rowOf('Integração CI')).getByText('Active')).toBeTruthy();
    expect(within(rowOf('Integração CI')).getByText('Never used')).toBeTruthy();
    expect(within(rowOf('Relatórios')).getByText(/^Last used/)).toBeTruthy();
    expect(within(rowOf('Relatórios')).getByText('Read the workspace')).toBeTruthy();
    expect(within(rowOf('Relatórios')).getByText('Create and edit tasks')).toBeTruthy();
    expect(within(rowOf('Antigo')).getByText('Revoked')).toBeTruthy();
    expect(within(rowOf('Antigo')).queryByRole('button', { name: 'Revoke Antigo' })).toBeNull();
  });

  it('shows the owner who created each token', async () => {
    vi.spyOn(orbitService, 'me').mockResolvedValue(withScopes('owner', [...ADMIN_SCOPES, 'users:manage']));
    await setup();
    expect(screen.getByText(/As the owner you see and can revoke every token/)).toBeTruthy();
    expect(within(rowOf('Integração CI')).getByText('Owner: Ana Souza')).toBeTruthy();
    expect(within(rowOf('Relatórios')).getByText('Owner: Bruno Lima')).toBeTruthy();
  });

  it('offers only the permissions the person holds and shows the new token once', async () => {
    const create = vi.spyOn(apiTokenService, 'create').mockResolvedValue({ ...ACTIVE, id: 'k9', name: 'Script', token: 'orb_segredo_unico' });
    await setup([]);
    expect(await screen.findByText('No tokens yet')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'New token' }));
    const boxes = within(dialog()).getAllByRole('checkbox');
    expect(boxes).toHaveLength(ADMIN_SCOPES.length);
    expect(within(dialog()).queryByRole('checkbox', { name: 'Manage people' })).toBeNull();
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Create' }));
    expect(await within(dialog()).findByText('Give the token a name.')).toBeTruthy();
    fireEvent.change(within(dialog()).getByLabelText('Name'), { target: { value: ' Script ' } });
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Create' }));
    expect(await within(dialog()).findByText('Choose at least one permission.')).toBeTruthy();
    expect(create).not.toHaveBeenCalled();
    fireEvent.click(within(dialog()).getByRole('checkbox', { name: 'Create and edit tasks' }));
    fireEvent.click(within(dialog()).getByRole('checkbox', { name: 'Read tasks' }));
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(create).toHaveBeenCalledWith({ name: 'Script', scopes: ['tasks:read', 'tasks:write'] }));
    expect(((await screen.findByLabelText('Token')) as HTMLInputElement).value).toBe('orb_segredo_unico');
    fireEvent.click(screen.getByRole('button', { name: 'I stored it' }));
    await waitFor(() => expect(screen.queryByDisplayValue('orb_segredo_unico')).toBeNull());
    expect(document.body.textContent).not.toContain('orb_segredo_unico');
  });

  it('revokes a token only after confirming', async () => {
    const revoke = vi.spyOn(apiTokenService, 'revoke').mockResolvedValue(undefined);
    await setup();
    fireEvent.click(within(rowOf('Relatórios')).getByRole('button', { name: 'Revoke Relatórios' }));
    expect(within(dialog()).getByText('Revoke "Relatórios"? Anything using it stops working right away.')).toBeTruthy();
    expect(revoke).not.toHaveBeenCalled();
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Revoke' }));
    await waitFor(() => expect(revoke).toHaveBeenCalledWith('k2'));
  });
});
