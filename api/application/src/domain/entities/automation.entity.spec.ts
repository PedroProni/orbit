import { AutomationEntity } from '@domain/entities/automation.entity';
import { AutomationActionType, AutomationTriggerType } from '@domain/enums/automation.enums';

const automation = (triggerStatus: string | null, triggerType = AutomationTriggerType.STATUS_CHANGED, listId: string | null = null) =>
  new AutomationEntity({
    _id: 'a1',
    workspaceId: 'w1',
    listId,
    name: 'rule',
    triggerType,
    triggerStatus,
    actionType: AutomationActionType.ADD_TAG,
    actionValue: 'x',
    active: true,
    createdBy: 'u1',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

describe('AutomationEntity.matches', () => {
  it('fires on the exact status name', () => {
    expect(automation('completed').matches(AutomationTriggerType.STATUS_CHANGED, 'l1', 'completed')).toBe(true);
    expect(automation('completed').matches(AutomationTriggerType.STATUS_CHANGED, 'l1', 'in review')).toBe(false);
  });

  it('fires when a rule saved with a legacy ClickUp name meets its consolidated status', () => {
    expect(automation('deployed').matches(AutomationTriggerType.STATUS_CHANGED, 'l1', 'completed')).toBe(true);
    expect(automation('testing').matches(AutomationTriggerType.STATUS_CHANGED, 'l1', 'in review')).toBe(true);
    expect(automation('deployed').matches(AutomationTriggerType.STATUS_CHANGED, 'l1', 'in review')).toBe(false);
  });

  it('does not fire for an unknown name, a missing status, another list or another trigger', () => {
    expect(automation('shipping').matches(AutomationTriggerType.STATUS_CHANGED, 'l1', 'completed')).toBe(false);
    expect(automation('deployed').matches(AutomationTriggerType.STATUS_CHANGED, 'l1', undefined)).toBe(false);
    expect(automation('completed', AutomationTriggerType.STATUS_CHANGED, 'l2').matches(AutomationTriggerType.STATUS_CHANGED, 'l1', 'completed')).toBe(false);
    expect(automation('completed').matches(AutomationTriggerType.TASK_CREATED, 'l1', 'completed')).toBe(false);
    expect(automation(null, AutomationTriggerType.TASK_CREATED).matches(AutomationTriggerType.TASK_CREATED, 'l1', undefined)).toBe(true);
  });
});
