import { WorkspaceSummaryUseCase } from './workspace-summary.use-case';
import { AuditActorType } from '@domain/enums/audit-log.enums';
import { UserRole } from '@domain/enums/user.enums';

const CANARIES = {
  secret: 'canary-webhook-secret-7f3a',
  token: 'canary-github-token-9c1d',
  automation: 'canary-automation-key-2b8e',
  s3Secret: 'canary-s3-secret-5d0c',
  s3Access: 'canary-s3-access-1e4f',
  endpoint: 'https://canary-user:canary-pass@s3.internal.example',
};

const setup = (configured: boolean) => {
  const counting = (value: number) => ({ count: jest.fn().mockResolvedValue(value) });
  const users = { count: jest.fn().mockImplementation(async (filter: Record<string, string>) => (filter.role === 'owner' ? 1 : filter.role === 'admin' ? 2 : filter.status === 'active' ? 6 : filter.status === 'disabled' ? 1 : 1)) };
  const workspaces = { findById: jest.fn().mockResolvedValue({ getName: () => 'Acme', getSlug: () => 'main', getCreatedAt: () => new Date(0) }) };
  const tasks = { count: jest.fn().mockImplementation(async (filter: Record<string, unknown>) => (filter.date_closed === null ? 40 : 12)) };
  const env = {
    getGithubWebhookSecret: () => (configured ? CANARIES.secret : ''),
    getGithubToken: () => (configured ? CANARIES.token : ''),
    getGithubRepositories: () => (configured ? ['PedroProni/orbit-api', 'PedroProni/orbit-frontend'] : []),
    getAutomationSecretKey: () => (configured ? CANARIES.automation : ''),
    getS3Endpoint: () => (configured ? CANARIES.endpoint : ''),
    getS3AccessKey: () => (configured ? CANARIES.s3Access : ''),
    getS3SecretKey: () => (configured ? CANARIES.s3Secret : ''),
    getS3Bucket: () => 'canary-bucket-name',
    isDevLoginEnabled: () => configured,
  };
  const useCase = new WorkspaceSummaryUseCase(workspaces as never, users as never, counting(3) as never, counting(2) as never, counting(9) as never, tasks as never, counting(5) as never, env as never);
  return { useCase, users, tasks, workspaces };
};

describe('WorkspaceSummaryUseCase', () => {
  const principal = { workspaceId: 'w1', actorType: AuditActorType.USER, actorId: 'u1', userId: 'u1', role: UserRole.ADMIN, scopes: [] };

  it('returns workspace facts, counts and integration booleans scoped to the workspace', async () => {
    const { useCase, users, tasks } = setup(true);
    const summary = await useCase.execute(principal);
    expect(summary).toEqual({
      workspace: { name: 'Acme', slug: 'main', createdAt: new Date(0) },
      members: { byRole: { owner: 1, admin: 2, member: 1, viewer: 1, guest: 1 }, byStatus: { active: 6, disabled: 1 } },
      counts: { spaces: 3, folders: 2, lists: 9, openTasks: 40, closedTasks: 12, docs: 5 },
      integrations: { githubWebhookSecret: true, githubToken: true, githubRepositories: 2, automationKey: true, fileStorage: true, devLogin: true },
    });
    for (const call of [...users.count.mock.calls, ...tasks.count.mock.calls]) expect(call[0]).toEqual(expect.objectContaining({ workspace_id: 'w1' }));
  });

  it('never returns an environment value, a URL with credentials or the bucket name', async () => {
    const text = JSON.stringify(await setup(true).useCase.execute(principal));
    for (const value of [...Object.values(CANARIES), 'canary-user', 'canary-pass', 'canary-bucket-name', 's3.internal.example']) expect(text).not.toContain(value);
  });

  it('reports every integration as not configured when the environment is empty', async () => {
    const summary = await setup(false).useCase.execute(principal);
    expect(summary.integrations).toEqual({ githubWebhookSecret: false, githubToken: false, githubRepositories: 0, automationKey: false, fileStorage: false, devLogin: false });
  });
});
