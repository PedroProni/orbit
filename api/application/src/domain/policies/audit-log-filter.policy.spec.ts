import { AuditLogFilterPolicy } from './audit-log-filter.policy';

describe('AuditLogFilterPolicy', () => {
  it('always scopes the query to the workspace', () => {
    expect(AuditLogFilterPolicy.toQuery('w1', {})).toEqual({ workspace_id: 'w1' });
  });

  it('matches an exact action, or a whole group with a range and never a regular expression', () => {
    expect(AuditLogFilterPolicy.toQuery('w1', { action: 'task.updated' }).action).toBe('task.updated');
    expect(AuditLogFilterPolicy.toQuery('w1', { action: 'task' }).action).toEqual({ $gte: 'task.', $lt: 'task/' });
  });

  it('maps actor, entity and period filters', () => {
    const from = new Date('2026-11-01T00:00:00Z');
    const to = new Date('2026-11-02T00:00:00Z');
    expect(AuditLogFilterPolicy.toQuery('w1', { actorId: 'u1', entityType: 'task', entityId: '86abc1234', from, to })).toEqual({ workspace_id: 'w1', actor_id: 'u1', entity_type: 'task', entity_id: '86abc1234', created_at: { $gte: from, $lte: to } });
    expect(AuditLogFilterPolicy.toQuery('w1', { to }).created_at).toEqual({ $lte: to });
  });

  it('accepts an open or ordered period and refuses from after to', () => {
    const a = new Date('2026-11-01T00:00:00Z');
    const b = new Date('2026-11-02T00:00:00Z');
    expect(AuditLogFilterPolicy.isRangeValid({ from: a, to: b })).toBe(true);
    expect(AuditLogFilterPolicy.isRangeValid({ from: a, to: a })).toBe(true);
    expect(AuditLogFilterPolicy.isRangeValid({ from: a })).toBe(true);
    expect(AuditLogFilterPolicy.isRangeValid({ from: b, to: a })).toBe(false);
  });
});
