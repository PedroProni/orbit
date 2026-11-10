import { BadRequestException } from '@nestjs/common';
import { ListAuditLogsUseCase } from './list-audit-logs.use-case';
import { AuditLogEntity } from '@domain/entities/audit-log.entity';
import { AuditActorType } from '@domain/enums/audit-log.enums';
import { UserRole } from '@domain/enums/user.enums';
import { KeysetCursorPolicy } from '@domain/policies/keyset-cursor.policy';
import { AuthPrincipal } from '@domain/types/auth-principal.type';

const principal: AuthPrincipal = { workspaceId: 'w1', actorType: AuditActorType.USER, actorId: 'u1', userId: 'u1', role: UserRole.ADMIN, scopes: [] };
const log = (id: string, meta: Record<string, unknown> = {}) =>
  new AuditLogEntity({
    _id: id,
    workspaceId: 'w1',
    actorType: AuditActorType.USER,
    actorId: 'u1',
    action: 'task.updated',
    entityType: 'task',
    entityId: '86abc1234',
    meta,
    createdAt: new Date('2026-11-10T10:00:00Z'),
    updatedAt: new Date('2026-11-10T10:00:00Z'),
  });

const setup = () => {
  const logs = { findKeyset: jest.fn().mockResolvedValue({ items: [], next: null }) };
  const references = { resolve: jest.fn().mockResolvedValue({ actors: new Map(), entities: new Map() }) };
  return { useCase: new ListAuditLogsUseCase(logs as never, references as never), logs, references };
};

describe('ListAuditLogsUseCase', () => {
  it('reads the first page scoped to the workspace with the default limit', async () => {
    const { useCase, logs } = setup();
    expect(await useCase.execute(principal, {})).toEqual({ items: [], nextCursor: null });
    expect(logs.findKeyset).toHaveBeenCalledWith({ workspace_id: 'w1' }, null, 50);
  });

  it('keeps the workspace filter when a cursor is given, so a cursor only moves the position', async () => {
    const { useCase, logs } = setup();
    const position = { createdAt: new Date('2026-11-09T00:00:00Z'), id: 'other-workspace-row' };
    await useCase.execute(principal, { cursor: KeysetCursorPolicy.encode(position), limit: 100, action: 'task' });
    expect(logs.findKeyset).toHaveBeenCalledWith({ workspace_id: 'w1', action: { $gte: 'task.', $lt: 'task/' } }, position, 100);
  });

  it('returns the next cursor and strips sensitive meta keys', async () => {
    const { useCase, logs } = setup();
    const next = { createdAt: new Date('2026-11-10T10:00:00Z'), id: 'a2' };
    logs.findKeyset.mockResolvedValueOnce({ items: [log('a2', { name: 'x', Token: 'secret-value', nested: { password: 'p' } })], next });
    const page = await useCase.execute(principal, {});
    expect(page.nextCursor).toBe(KeysetCursorPolicy.encode(next));
    expect(page.items[0].meta).toEqual({ name: 'x', nested: {} });
    expect(JSON.stringify(page)).not.toContain('secret-value');
  });

  it('refuses a broken cursor and a period that ends before it starts, without reading', async () => {
    const { useCase, logs } = setup();
    await expect(useCase.execute(principal, { cursor: 'bm90LWpzb24' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(useCase.execute(principal, { from: '2026-11-02T00:00:00Z', to: '2026-11-01T00:00:00Z' })).rejects.toBeInstanceOf(BadRequestException);
    expect(logs.findKeyset).not.toHaveBeenCalled();
  });
});
