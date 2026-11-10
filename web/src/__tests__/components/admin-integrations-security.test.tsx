// @vitest-environment jsdom
import { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { adminSpace, principal } from '../helpers/admin-fixtures';
import { chooseOption } from '../helpers/choose-option';
import { MEMBERS, resetUiStore } from '../helpers/fixtures';
import { AdminShell } from '@/components/admin/admin-shell';
import { AuditLogAdminPage } from '@/components/admin/audit-log-admin-page';
import { GeneralAdminPage } from '@/components/admin/general-admin-page';
import { GithubAdminPage } from '@/components/admin/github-admin-page';
import { auditService } from '@/services/audit.service';
import { AuditLogItem } from '@/services/audit.types';
import { githubIntegrationService } from '@/services/github-integration.service';
import { GithubIntegration, WebhookDelivery } from '@/services/github-integration.types';
import { orbitService } from '@/services/orbit.service';
import { workspaceSummaryService } from '@/services/workspace-summary.service';
import { WorkspaceSummary } from '@/services/workspace-summary.types';
import { useSessionStore } from '@/stores/session.store';
import { useUiStore } from '@/stores/ui.store';

vi.mock('next/navigation', () => ({ usePathname: () => '/admin/audit-log', useParams: () => ({}), useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));

const entry = (over: Partial<AuditLogItem>): AuditLogItem => ({
  id: 'a1',
  createdAt: '2026-11-09T12:00:00.000Z',
  action: 'task.updated',
  actor: { type: 'user', id: 'u1', name: 'Ana Souza', deleted: false },
  entity: { type: 'task', id: 't1', label: 'Corrigir login', deleted: false },
  meta: {},
  ...over,
});

const UPDATED = entry({ meta: { changed: ['title', 'dueDate'], diff: { title: { before: 'a', after: 'b' } } } });
const DELETED_TASK = entry({ id: 'a2', action: 'task.deleted', entity: { type: 'task', id: '665f00000000000000000abc', label: null, deleted: true } });
const HIDDEN_TOKEN = entry({ id: 'a3', action: 'token.created', actor: { type: 'token', id: 'k1', name: null, deleted: false }, entity: { type: 'api_token', id: 'k9', label: null, deleted: false }, meta: { scopes: ['tasks:read'] } });
const GONE_PERSON = entry({ id: 'a4', action: 'user.role_changed', actor: { type: 'user', id: 'u9', name: null, deleted: true }, entity: { type: 'user', id: 'u2', label: 'Bruno Lima', deleted: false }, meta: { before: 'member', after: 'admin' } });
const GITHUB = entry({ id: 'a5', action: 'task.pull_request_linked', actor: { type: 'webhook', id: 'github', name: null, deleted: false }, entity: { type: 'task', id: 't2', label: 'Tela de saque', deleted: false } });
const FORM = entry({ id: 'a6', action: 'task.created', actor: { type: 'system', id: 'form:f1', name: null, deleted: false }, entity: { type: 'task', id: 't3', label: 'Pedido do formulário', deleted: false } });
const COMMENT = entry({ id: 'a7', action: 'comment.created', entity: { type: 'comment', id: 'c1', label: null, deleted: false }, meta: { taskId: 't4' } });
const UNKNOWN = entry({ id: 'a8', action: 'future.thing', actor: { type: 'system', id: 'nightly', name: null, deleted: false }, entity: { type: 'future', id: 'x1', label: null, deleted: false } });

const INTEGRATION: GithubIntegration = { secretConfigured: true, tokenConfigured: false, webhookPath: '/webhooks/github', syncIntervalMs: 300000, repositories: [{ fullName: 'org/acme-bet', lastSuccessAt: null, syncing: true }] };
const delivery = (over: Partial<WebhookDelivery>): WebhookDelivery => ({
  id: 'd1',
  deliveryId: 'g-1',
  event: 'pull_request',
  action: 'opened',
  repository: 'org/acme-bet',
  outcome: 'processed',
  failureCode: null,
  linkedTasks: 1,
  duplicates: 31,
  receivedAt: '2026-11-09T12:00:00.000Z',
  finishedAt: '2026-11-09T12:00:01.000Z',
  ...over,
});

const SUMMARY: WorkspaceSummary = {
  workspace: { name: 'acme', slug: 'p4t', createdAt: '2026-01-10T12:00:00.000Z' },
  members: { byRole: { owner: 1, admin: 2, member: 7, viewer: 3, guest: 4 }, byStatus: { active: 15, disabled: 2 } },
  counts: { spaces: 3, folders: 5, lists: 11, openTasks: 120, closedTasks: 480, docs: 9 },
  integrations: { githubWebhookSecret: true, githubToken: false, githubRepositories: 2, automationKey: true, fileStorage: false, devLogin: false },
};

const render = (page: ReactElement) => renderWithProviders(<AdminShell>{page}</AdminShell>);

describe('integrations and security administration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetUiStore();
    useSessionStore.setState({ authenticated: true, hydrated: true });
    vi.spyOn(orbitService, 'me').mockResolvedValue(principal('admin'));
    vi.spyOn(orbitService, 'hierarchy').mockResolvedValue([adminSpace()]);
    vi.spyOn(orbitService, 'members').mockResolvedValue(MEMBERS);
  });
  afterEach(() => cleanup());

  describe.each(['member', 'viewer', 'guest'])('a %s', (role) => {
    beforeEach(() => vi.spyOn(orbitService, 'me').mockResolvedValue(principal(role)));

    it('is refused on the audit log and the log is never asked for', async () => {
      const list = vi.spyOn(auditService, 'list').mockResolvedValue({ items: [UPDATED], nextCursor: null });
      render(<AuditLogAdminPage />);
      expect(await screen.findByText('You do not have access to this page')).toBeTruthy();
      expect(list).not.toHaveBeenCalled();
      expect(screen.queryByText('Corrigir login')).toBeNull();
    });

    it('is refused on the GitHub page and nothing is asked for', async () => {
      const status = vi.spyOn(githubIntegrationService, 'status').mockResolvedValue(INTEGRATION);
      const deliveries = vi.spyOn(githubIntegrationService, 'deliveries').mockResolvedValue({ items: [], nextCursor: null });
      render(<GithubAdminPage />);
      expect(await screen.findByText('You do not have access to this page')).toBeTruthy();
      expect(status).not.toHaveBeenCalled();
      expect(deliveries).not.toHaveBeenCalled();
    });

    it('is refused on the general page and the summary is never asked for', async () => {
      const get = vi.spyOn(workspaceSummaryService, 'get').mockResolvedValue(SUMMARY);
      render(<GeneralAdminPage />);
      expect(await screen.findByText('You do not have access to this page')).toBeTruthy();
      expect(get).not.toHaveBeenCalled();
    });
  });

  it('lists the three new pages in the menu for an admin, General first and the audit log under Security', async () => {
    vi.spyOn(workspaceSummaryService, 'get').mockResolvedValue(SUMMARY);
    render(<GeneralAdminPage />);
    await screen.findByText('acme');
    const nav = screen.getAllByRole('navigation')[0];
    const links = within(nav)
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'));
    expect(links[0]).toBe('/admin/general');
    expect(links).toContain('/admin/audit-log');
    expect(links).toContain('/admin/github');
    expect(within(nav).getByText('Security')).toBeTruthy();
  });

  describe('audit log', () => {
    it('labels people, tokens, systems and translated actions, and shows the stored id with a deleted hint', async () => {
      vi.spyOn(auditService, 'list').mockResolvedValue({ items: [UPDATED, DELETED_TASK, HIDDEN_TOKEN, GONE_PERSON, GITHUB, FORM, COMMENT, UNKNOWN], nextCursor: null });
      render(<AuditLogAdminPage />);
      expect(await screen.findByText('Changed: Title, Due date')).toBeTruthy();
      expect(screen.getAllByText('Ana Souza').length).toBeGreaterThan(0);
      expect(screen.getByText('changed a task')).toBeTruthy();
      const deletedRow = screen.getByText('665f00000000000000000abc').closest('li') as HTMLElement;
      expect(within(deletedRow).getByText('Deleted item')).toBeTruthy();
      expect(within(deletedRow).queryByRole('button')).toBeNull();
      const tokenRow = screen.getByText('created an API token').closest('li') as HTMLElement;
      expect(within(tokenRow).getAllByText('API token').length).toBeGreaterThan(0);
      expect(within(tokenRow).getByText('Name hidden')).toBeTruthy();
      expect(within(tokenRow).queryByText('k9')).toBeNull();
      expect(within(tokenRow).getByText('tasks:read')).toBeTruthy();
      const goneRow = screen.getByText('changed the role of a person').closest('li') as HTMLElement;
      expect(within(goneRow).getByText('Removed person')).toBeTruthy();
      expect(within(goneRow).getByText('From Member to Administrator')).toBeTruthy();
      expect(within(screen.getByText('linked a pull request').closest('li') as HTMLElement).getByText('GitHub')).toBeTruthy();
      expect(screen.getByText('Public form')).toBeTruthy();
      expect(screen.getByText('future.thing')).toBeTruthy();
      expect(within(screen.getByText('future.thing').closest('li') as HTMLElement).getByText('x1')).toBeTruthy();
      expect(screen.getByText('System')).toBeTruthy();
    });

    it('opens the task modal from a task entry and from a comment entry', async () => {
      vi.spyOn(auditService, 'list').mockResolvedValue({ items: [UPDATED, COMMENT], nextCursor: null });
      vi.spyOn(orbitService, 'task').mockReturnValue(new Promise(() => undefined));
      render(<AuditLogAdminPage />);
      fireEvent.click(await screen.findByRole('button', { name: 'Open task Corrigir login' }));
      expect(useUiStore.getState().openTaskId).toBe('t1');
      fireEvent.click(screen.getByRole('button', { name: 'Open task c1' }));
      expect(useUiStore.getState().openTaskId).toBe('t4');
    });

    it('sends the filters, refuses an inverted period without asking again and loads the next page with the cursor', async () => {
      const list = vi.spyOn(auditService, 'list').mockImplementation(async (_filters, cursor) => (cursor ? { items: [GONE_PERSON], nextCursor: null } : { items: [UPDATED], nextCursor: 'c-2' }));
      render(<AuditLogAdminPage />);
      await screen.findByText('Changed: Title, Due date');
      chooseOption(screen.getByRole('combobox', { name: 'Who' }), 'Bruno Lima');
      await waitFor(() => expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ actorId: 'u2' }), null));
      chooseOption(screen.getByRole('combobox', { name: 'Action' }), 'People');
      chooseOption(screen.getByRole('combobox', { name: 'Item' }), 'API token');
      await waitFor(() => expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ actorId: 'u2', action: 'user', entityType: 'api_token' }), null));
      fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-11-09' } });
      await waitFor(() => expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ from: new Date('2026-11-09T00:00:00').toISOString() }), null));
      const calls = list.mock.calls.length;
      fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-11-01' } });
      expect(await screen.findByRole('alert')).toBeTruthy();
      expect(screen.getByRole('alert').textContent).toBe('The start date must be on or before the end date.');
      expect(list.mock.calls.length).toBe(calls);
      fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-11-10' } });
      await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
      await waitFor(() => expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ to: new Date('2026-11-10T23:59:59.999').toISOString() }), null));
      fireEvent.click(await screen.findByRole('button', { name: 'Load more' }));
      await waitFor(() => expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ actorId: 'u2' }), 'c-2'));
      expect(await screen.findByText('Removed person')).toBeTruthy();
    });

    it('shows an empty state when nothing matches', async () => {
      vi.spyOn(auditService, 'list').mockResolvedValue({ items: [], nextCursor: null });
      render(<AuditLogAdminPage />);
      expect(await screen.findByText('Nothing recorded for these filters')).toBeTruthy();
    });
  });

  describe('GitHub page', () => {
    it('shows only whether secrets are set, the repositories and the deliveries without payloads', async () => {
      vi.spyOn(githubIntegrationService, 'status').mockResolvedValue(INTEGRATION);
      vi.spyOn(githubIntegrationService, 'deliveries').mockResolvedValue({
        items: [
          delivery({}),
          delivery({ id: 'd2', event: 'ping', action: null, repository: null, outcome: 'ignored', linkedTasks: 0, duplicates: 0 }),
          delivery({ id: 'd3', outcome: 'failed', failureCode: 'internal', duplicates: 0, linkedTasks: 0 }),
        ],
        nextCursor: null,
      });
      render(<GithubAdminPage />);
      const secret = (await screen.findByText('Webhook secret')).closest('div') as HTMLElement;
      expect(screen.getAllByText('Configured').length).toBe(1);
      expect(screen.getAllByText('Not configured').length).toBe(1);
      expect(secret).toBeTruthy();
      expect(screen.getByText('Without it tasks only show what the webhook sends.')).toBeTruthy();
      expect(screen.getByText('/webhooks/github')).toBeTruthy();
      expect(screen.getByText('Synced every 5 minutes')).toBeTruthy();
      expect(screen.getAllByText('org/acme-bet').length).toBeGreaterThan(0);
      expect(screen.getByText('Syncing')).toBeTruthy();
      expect(screen.getByText('Never synced')).toBeTruthy();
      expect(await screen.findByText('Repeated 31 times')).toBeTruthy();
      expect(screen.getByText('1 task linked')).toBeTruthy();
      expect(screen.getByText('No repository')).toBeTruthy();
      expect(screen.getByText('Ignored')).toBeTruthy();
      expect(screen.getByText('Processing failed')).toBeTruthy();
      expect(document.body.textContent).not.toMatch(/ghp_|whsec_|sha256=/);
    });

    it('filters deliveries by event and result', async () => {
      vi.spyOn(githubIntegrationService, 'status').mockResolvedValue(INTEGRATION);
      const deliveries = vi.spyOn(githubIntegrationService, 'deliveries').mockResolvedValue({ items: [], nextCursor: null });
      render(<GithubAdminPage />);
      expect(await screen.findByText('No deliveries yet')).toBeTruthy();
      chooseOption(screen.getByRole('combobox', { name: 'Event' }), 'push');
      chooseOption(screen.getByRole('combobox', { name: 'Result' }), 'Failed');
      await waitFor(() => expect(deliveries).toHaveBeenLastCalledWith({ event: 'push', outcome: 'failed' }, null));
    });
  });

  describe('general page', () => {
    it('shows counts and booleans only, without the development sign-in warning when it is off', async () => {
      vi.spyOn(workspaceSummaryService, 'get').mockResolvedValue(SUMMARY);
      render(<GeneralAdminPage />);
      expect(await screen.findByText('acme')).toBeTruthy();
      expect(screen.getByText('p4t')).toBeTruthy();
      const people = screen.getByRole('region', { name: 'People' });
      expect(within(people).getByText('Administrator').nextSibling?.textContent).toBe('2');
      expect(within(people).getByText('Disabled').nextSibling?.textContent).toBe('2');
      const content = screen.getByRole('region', { name: 'Content' });
      expect(within(content).getByText('Closed tasks').nextSibling?.textContent).toBe('480');
      const integrations = screen.getByRole('region', { name: 'Integrations' });
      expect(within(integrations).getAllByText('Configured')).toHaveLength(2);
      expect(within(integrations).getAllByText('Not configured')).toHaveLength(2);
      expect(within(integrations).getByText('2 GitHub repositories are synced.')).toBeTruthy();
      expect(screen.queryByText(/Development sign-in is on/)).toBeNull();
    });

    it('warns when development sign-in is on', async () => {
      vi.spyOn(workspaceSummaryService, 'get').mockResolvedValue({ ...SUMMARY, integrations: { ...SUMMARY.integrations, devLogin: true } });
      render(<GeneralAdminPage />);
      expect((await screen.findByRole('status')).textContent).toMatch(/Development sign-in is on/);
    });
  });
});
