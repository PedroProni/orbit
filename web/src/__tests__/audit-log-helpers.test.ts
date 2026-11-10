import { describe, expect, it } from 'vitest';
import { EMPTY_AUDIT_DRAFT } from '@/components/admin/audit-log.constants';
import { auditActionGroup, auditActorLabel, auditMetaSummary, auditTaskTarget, isAuditEntityNameHidden, isAuditRangeInvalid, toAuditFilters } from '@/components/admin/audit-log.helpers';
import { AuditLogItem } from '@/services/audit.types';

const item = (over: Partial<AuditLogItem>): AuditLogItem => ({
  id: 'a1',
  createdAt: '2026-11-09T12:00:00.000Z',
  action: 'task.updated',
  actor: { type: 'user', id: 'u1', name: 'Ana', deleted: false },
  entity: { type: 'task', id: 't1', label: 'T', deleted: false },
  meta: {},
  ...over,
});

describe('audit log helpers', () => {
  it('turns empty filters into no query and local days into ISO bounds', () => {
    expect(toAuditFilters(EMPTY_AUDIT_DRAFT)).toEqual({ actorId: undefined, action: undefined, entityType: undefined, from: undefined, to: undefined });
    const filters = toAuditFilters({ ...EMPTY_AUDIT_DRAFT, actorId: 'github', group: 'task', fromDay: '2026-11-01', toDay: '2026-11-01' });
    expect(filters).toEqual({ actorId: 'github', action: 'task', entityType: undefined, from: new Date('2026-11-01T00:00:00').toISOString(), to: new Date('2026-11-01T23:59:59.999').toISOString() });
  });

  it('flags only a start after the end and ignores broken dates', () => {
    expect(isAuditRangeInvalid({ ...EMPTY_AUDIT_DRAFT, fromDay: '2026-11-02', toDay: '2026-11-01' })).toBe(true);
    expect(isAuditRangeInvalid({ ...EMPTY_AUDIT_DRAFT, fromDay: '2026-11-01', toDay: '2026-11-01' })).toBe(false);
    expect(isAuditRangeInvalid({ ...EMPTY_AUDIT_DRAFT, fromDay: 'not-a-day', toDay: '2026-11-01' })).toBe(false);
    expect(toAuditFilters({ ...EMPTY_AUDIT_DRAFT, fromDay: 'not-a-day' }).from).toBeUndefined();
  });

  it('labels every kind of actor without showing a hidden token name', () => {
    expect(auditActorLabel(item({}))).toEqual({ key: 'actor.person', text: 'Ana' });
    expect(auditActorLabel(item({ actor: { type: 'user', id: 'u9', name: null, deleted: true } }))).toEqual({ key: 'actor.deletedPerson' });
    expect(auditActorLabel(item({ actor: { type: 'token', id: 'k1', name: 'CI', deleted: false } }))).toEqual({ key: 'actor.token', values: { name: 'CI' } });
    expect(auditActorLabel(item({ actor: { type: 'token', id: 'k1', name: null, deleted: false } }))).toEqual({ key: 'actor.hiddenToken' });
    expect(auditActorLabel(item({ actor: { type: 'system', id: 'form:f1', name: null, deleted: false } }))).toEqual({ key: 'actor.system.form' });
    expect(auditActorLabel(item({ actor: { type: 'system', id: 'issue-access-link', name: null, deleted: false } }))).toEqual({ key: 'actor.system.accessLink' });
    expect(auditActorLabel(item({ actor: { type: 'webhook', id: 'github', name: null, deleted: false } }))).toEqual({ key: 'actor.system.github' });
    expect(auditActorLabel(item({ actor: { type: 'system', id: 'constructor', name: null, deleted: false } }))).toEqual({ key: 'actor.system.other' });
  });

  it('summarises changed fields and safe details only', () => {
    expect(auditMetaSummary({ changed: ['title', 3, 'descriptionMd'], diff: { title: {} } }).fields).toEqual(['title', 'descriptionMd']);
    expect(auditMetaSummary({ diff: { status: {}, priority: {} } }).fields).toEqual(['status', 'priority']);
    expect(auditMetaSummary({ name: 'CI', scopes: ['tasks:read', 1, 'tokens:manage'], other: { deep: 'x' }, ip: '10.0.0.1' }).details).toEqual([
      ['name', 'CI'],
      ['ip', '10.0.0.1'],
      ['scopes', 'tasks:read, tokens:manage'],
    ]);
    expect(auditMetaSummary({ title: { nested: true } }).details).toEqual([]);
  });

  it('reads a role change as a transition only when both sides are text', () => {
    expect(auditMetaSummary({ before: 'member', after: 'admin' }).transition).toEqual({ before: 'member', after: 'admin' });
    expect(auditMetaSummary({ before: ['Open'], after: ['Open', 'Done'] }).transition).toBeNull();
    expect(auditMetaSummary({ after: 'admin' }).transition).toBeNull();
    expect(auditMetaSummary({ changed: ['title'], diff: { title: { before: 'a', after: 'b' } } }).transition).toBeNull();
  });

  it('marks only a token the reader cannot see as a hidden name, never an unknown type or a deleted token', () => {
    expect(isAuditEntityNameHidden(item({ entity: { type: 'api_token', id: 'k1', label: null, deleted: false } }))).toBe(true);
    expect(isAuditEntityNameHidden(item({ entity: { type: 'api_token', id: 'k1', label: 'CI', deleted: false } }))).toBe(false);
    expect(isAuditEntityNameHidden(item({ entity: { type: 'api_token', id: 'k1', label: null, deleted: true } }))).toBe(false);
    expect(isAuditEntityNameHidden(item({ entity: { type: 'session', id: 's1', label: null, deleted: false } }))).toBe(false);
  });

  it('opens a task only when it still exists, and the task of a comment', () => {
    expect(auditTaskTarget(item({}))).toBe('t1');
    expect(auditTaskTarget(item({ entity: { type: 'task', id: 't1', label: null, deleted: true } }))).toBeNull();
    expect(auditTaskTarget(item({ entity: { type: 'comment', id: 'c1', label: null, deleted: false }, meta: { taskId: 't7' } }))).toBe('t7');
    expect(auditTaskTarget(item({ entity: { type: 'comment', id: 'c1', label: null, deleted: false }, meta: { taskId: { $ne: 1 } } }))).toBeNull();
    expect(auditTaskTarget(item({ entity: { type: 'list', id: 'l1', label: 'L', deleted: false } }))).toBeNull();
    expect(auditActionGroup('custom_field.updated')).toBe('custom_field');
  });
});
