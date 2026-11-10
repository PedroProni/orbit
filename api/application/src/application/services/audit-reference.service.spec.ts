import { AuditReferenceService } from './audit-reference.service';
import { AuditLogEntity } from '@domain/entities/audit-log.entity';
import { AuditActorType } from '@domain/enums/audit-log.enums';
import { UserRole } from '@domain/enums/user.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';

const who = (role: UserRole, userId: string): AuthPrincipal => ({ workspaceId: 'w1', actorType: AuditActorType.USER, actorId: userId, userId, role, scopes: [] });
const log = (actorType: AuditActorType, actorId: string, entityType: string, entityId: string) =>
  new AuditLogEntity({ _id: `${actorId}-${entityId}`, workspaceId: 'w1', actorType, actorId, action: 'x.y', entityType, entityId, meta: {}, createdAt: new Date(0), updatedAt: new Date(0) });
const repo = (rows: Array<Record<string, unknown>>) => ({ findMany: jest.fn().mockImplementation(async (filter: { _id: { $in: string[] } }) => rows.filter((row) => filter._id.$in.includes((row.getId as () => string)()))) });
const named = (id: string, name: string) => ({ getId: () => id, getName: () => name });

const setup = () => {
  const users = repo([named('owner', 'Owner'), named('admin', 'Admin')]);
  const tokens = repo([
    { getId: () => 'tok-owner', getName: () => 'Owner deploy key', getUserId: () => 'owner' },
    { getId: () => 'tok-admin', getName: () => 'Admin script', getUserId: () => 'admin' },
  ]);
  const tasks = repo([{ getId: () => '86abc1234', getTitle: () => 'Renamed task' }]);
  const empty = () => repo([]);
  const service = new AuditReferenceService(
    users as never,
    tokens as never,
    tasks as never,
    empty() as never,
    empty() as never,
    empty() as never,
    empty() as never,
    empty() as never,
    empty() as never,
    empty() as never,
    empty() as never,
    empty() as never,
    empty() as never,
    empty() as never,
    empty() as never,
  );
  return { service, users, tokens, tasks };
};

describe('AuditReferenceService', () => {
  const logs = [
    log(AuditActorType.TOKEN, 'tok-owner', 'api_token', 'tok-owner'),
    log(AuditActorType.TOKEN, 'tok-admin', 'api_token', 'tok-admin'),
    log(AuditActorType.USER, 'admin', 'task', '86abc1234'),
    log(AuditActorType.USER, 'gone-user', 'task', '86deleted1'),
    log(AuditActorType.WEBHOOK, 'github', 'session', 's1'),
  ];

  it('hides the name of the owner token from an admin but shows the admin own token', async () => {
    const { service } = setup();
    const refs = await service.resolve(who(UserRole.ADMIN, 'admin'), logs);
    expect(refs.actors.get('token:tok-owner')).toEqual({ label: null, deleted: false });
    expect(refs.entities.get('api_token:tok-owner')).toEqual({ label: null, deleted: false });
    expect(refs.actors.get('token:tok-admin')).toEqual({ label: 'Admin script', deleted: false });
  });

  it('shows every token name to the owner', async () => {
    const { service } = setup();
    const refs = await service.resolve(who(UserRole.OWNER, 'owner'), logs);
    expect(refs.actors.get('token:tok-owner')?.label).toBe('Owner deploy key');
    expect(refs.entities.get('api_token:tok-admin')?.label).toBe('Admin script');
  });

  it('uses the current label of a renamed entity and marks deleted actors and entities', async () => {
    const { service } = setup();
    const refs = await service.resolve(who(UserRole.ADMIN, 'admin'), logs);
    expect(refs.entities.get('task:86abc1234')).toEqual({ label: 'Renamed task', deleted: false });
    expect(refs.entities.get('task:86deleted1')).toEqual({ label: null, deleted: true });
    expect(refs.actors.get('user:gone-user')).toEqual({ label: null, deleted: true });
    expect(refs.actors.get('webhook:github')).toEqual({ label: null, deleted: false });
    expect(refs.entities.get('session:s1')).toEqual({ label: null, deleted: false });
  });

  it('scopes every lookup to the principal workspace and skips lookups with nothing to find', async () => {
    const { service, users, tokens, tasks } = setup();
    await service.resolve(who(UserRole.ADMIN, 'admin'), logs);
    for (const call of [...users.findMany.mock.calls, ...tokens.findMany.mock.calls, ...tasks.findMany.mock.calls]) expect(call[0]).toEqual(expect.objectContaining({ workspace_id: 'w1' }));
    const fresh = setup();
    await fresh.service.resolve(who(UserRole.ADMIN, 'admin'), []);
    expect(fresh.users.findMany).not.toHaveBeenCalled();
    expect(fresh.tokens.findMany).not.toHaveBeenCalled();
  });
});
