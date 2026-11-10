import { AutomationEntity } from '@domain/entities/automation.entity';
import { AutomationActionType, AutomationTriggerType } from '@domain/enums/automation.enums';
import { AutomationRewrite } from '@domain/types/automation-rewrite.type';

const base = (over: Partial<ConstructorParameters<typeof AutomationEntity>[0]> = {}) =>
  new AutomationEntity({
    _id: 'a1',
    workspaceId: 'w1',
    listId: null,
    name: 'rule',
    triggerType: AutomationTriggerType.TASK_CREATED,
    triggerValue: null,
    actionType: AutomationActionType.ADD_TAG,
    actionValue: 'x',
    actionUserIds: [],
    webhookSecretEnc: null,
    active: true,
    armedAt: new Date('2026-01-01T00:00:00Z'),
    dateCursor: new Date('2026-01-02T00:00:00Z'),
    createdBy: 'u1',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...over,
  });

const input = (over: Partial<AutomationRewrite>): AutomationRewrite => ({
  listId: null,
  name: 'Regra',
  triggerType: AutomationTriggerType.TASK_CREATED,
  triggerValue: null,
  actionType: AutomationActionType.ADD_TAG,
  actionValue: 'auto',
  actionUserIds: [],
  active: true,
  ...over,
});

const rewrite = (over: Partial<AutomationRewrite>, entity = base()) => {
  entity.rewrite(input(over), new Date('2026-02-01T00:00:00Z'));
  return entity;
};

describe('AutomationEntity.rewrite triggers', () => {
  it('drops the value of task_created', () => {
    expect(rewrite({ triggerValue: 'ignored' }).getTriggerValue()).toBeNull();
  });

  it('requires a status for status_changed and keeps it trimmed', () => {
    expect(() => rewrite({ triggerType: AutomationTriggerType.STATUS_CHANGED, triggerValue: '  ' })).toThrow('A target status is required');
    expect(rewrite({ triggerType: AutomationTriggerType.STATUS_CHANGED, triggerValue: ' done ' }).getTriggerValue()).toBe('done');
  });

  it('accepts any or a valid priority for priority_changed', () => {
    expect(rewrite({ triggerType: AutomationTriggerType.PRIORITY_CHANGED, triggerValue: null }).getTriggerValue()).toBeNull();
    expect(rewrite({ triggerType: AutomationTriggerType.PRIORITY_CHANGED, triggerValue: 'urgent' }).getTriggerValue()).toBe('urgent');
    expect(() => rewrite({ triggerType: AutomationTriggerType.PRIORITY_CHANGED, triggerValue: 'maximum' })).toThrow('Invalid priority');
  });

  it('accepts anyone or one user for assignee_added', () => {
    expect(rewrite({ triggerType: AutomationTriggerType.ASSIGNEE_ADDED, triggerValue: '' }).getTriggerValue()).toBeNull();
    expect(rewrite({ triggerType: AutomationTriggerType.ASSIGNEE_ADDED, triggerValue: 'u2' }).getTriggerValue()).toBe('u2');
  });

  it('requires start_date or due_date for date_reached', () => {
    expect(rewrite({ triggerType: AutomationTriggerType.DATE_REACHED, triggerValue: 'due_date' }).getTriggerValue()).toBe('due_date');
    expect(rewrite({ triggerType: AutomationTriggerType.DATE_REACHED, triggerValue: 'start_date' }).getTriggerValue()).toBe('start_date');
    expect(() => rewrite({ triggerType: AutomationTriggerType.DATE_REACHED, triggerValue: null })).toThrow('A date field is required');
    expect(() => rewrite({ triggerType: AutomationTriggerType.DATE_REACHED, triggerValue: 'created_at' })).toThrow('A date field is required');
  });
});

describe('AutomationEntity.rewrite actions', () => {
  it('requires a name of at most 80 characters and an action value', () => {
    expect(() => rewrite({ name: '  ' })).toThrow('Automation name');
    expect(() => rewrite({ name: 'x'.repeat(81) })).toThrow('Automation name');
    expect(() => rewrite({ actionValue: '   ' })).toThrow('Action value is required');
  });

  it('validates priority, comment length and notify target', () => {
    expect(() => rewrite({ actionType: AutomationActionType.SET_PRIORITY, actionValue: 'maximum' })).toThrow('Invalid priority');
    expect(rewrite({ actionType: AutomationActionType.SET_PRIORITY, actionValue: 'high' }).getActionValue()).toBe('high');
    expect(rewrite({ actionType: AutomationActionType.COMMENT, actionValue: `  ${'a'.repeat(2000)}  ` }).getActionValue()).toHaveLength(2000);
    expect(() => rewrite({ actionType: AutomationActionType.COMMENT, actionValue: 'a'.repeat(2001) })).toThrow('at most 2000');
    expect(() => rewrite({ actionType: AutomationActionType.NOTIFY, actionValue: 'everyone' })).toThrow('Invalid notification target');
    expect(rewrite({ actionType: AutomationActionType.SET_STATUS, actionValue: ' Done ' }).getActionValue()).toBe('Done');
    expect(rewrite({ actionType: AutomationActionType.ASSIGN, actionValue: 'u2' }).getActionValue()).toBe('u2');
    expect(rewrite({ actionType: AutomationActionType.WEBHOOK, actionValue: 'https://hooks.example.com/x' }).getActionValue()).toBe('https://hooks.example.com/x');
    expect(() => rewrite({ actionType: AutomationActionType.WEBHOOK, actionValue: `https://e.com/${'a'.repeat(2048)}` })).toThrow('too long');
  });

  it('keeps users only for notify=users, deduplicated, between 1 and 20', () => {
    expect(rewrite({ actionType: AutomationActionType.NOTIFY, actionValue: 'users', actionUserIds: ['u1', 'u1', ' u2 '] }).getActionUserIds()).toEqual(['u1', 'u2']);
    expect(() => rewrite({ actionType: AutomationActionType.NOTIFY, actionValue: 'users', actionUserIds: [] })).toThrow('between 1 and 20');
    expect(() => rewrite({ actionType: AutomationActionType.NOTIFY, actionValue: 'users', actionUserIds: Array.from({ length: 21 }, (_, i) => `u${i}`) })).toThrow('between 1 and 20');
    expect(rewrite({ actionType: AutomationActionType.NOTIFY, actionValue: 'assignees', actionUserIds: ['u1'] }).getActionUserIds()).toEqual([]);
    expect(rewrite({ actionType: AutomationActionType.ADD_TAG, actionUserIds: ['u1'] }).getActionUserIds()).toEqual([]);
  });

  it('re-arms the date trigger and clears the cursor on every rewrite', () => {
    const entity = rewrite({});
    expect(entity.getArmedAt().toISOString()).toBe('2026-02-01T00:00:00.000Z');
    expect(entity.getDateCursor()).toBeNull();
  });

  it('drops the secret when the action stops being a webhook and only webhooks take a secret', () => {
    const hook = base({ actionType: AutomationActionType.WEBHOOK, actionValue: 'https://e.com', webhookSecretEnc: 'enc' });
    expect(hook.hasSecret()).toBe(true);
    rewrite({ actionType: AutomationActionType.WEBHOOK, actionValue: 'https://e.com/2' }, hook);
    expect(hook.hasSecret()).toBe(true);
    rewrite({ actionType: AutomationActionType.ADD_TAG }, hook);
    expect(hook.hasSecret()).toBe(false);
    expect(() => hook.replaceSecret('enc')).toThrow('Only webhook automations');
  });

  it('leaves the entity untouched when validation fails', () => {
    const entity = base();
    expect(() => entity.rewrite(input({ name: 'novo', actionType: AutomationActionType.SET_PRIORITY, actionValue: 'bad' }))).toThrow();
    expect(entity.getName()).toBe('rule');
    expect(entity.getDateCursor()).not.toBeNull();
  });
});
