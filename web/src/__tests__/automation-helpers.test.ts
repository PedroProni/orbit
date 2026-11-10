import { afterEach, describe, expect, it, vi } from 'vitest';
import { automationProblem, automationStatusNames, describeRunReason, draftToInput, emptyAutomationDraft, isHttpsUrl } from '@/components/admin/automation.helpers';
import { AutomationDraft } from '@/components/admin/automation.types';
import { api, ApiError } from '@/lib/api-client';
import { describeApiError } from '@/lib/api-error';
import { adminSpace } from './helpers/admin-fixtures';

const draft = (over: Partial<AutomationDraft>): AutomationDraft => ({ ...emptyAutomationDraft(), name: 'Rule', actionValue: 'u1', ...over });

describe('automation helpers', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('mirrors the contract limits on the client', () => {
    expect(automationProblem(draft({ name: '   ' }))).toBe('nameRequired');
    expect(automationProblem(draft({ triggerType: 'status_changed' }))).toBe('triggerValueRequired');
    expect(automationProblem(draft({ triggerType: 'date_reached' }))).toBe('triggerValueRequired');
    expect(automationProblem(draft({ triggerType: 'priority_changed' }))).toBeNull();
    expect(automationProblem(draft({ triggerType: 'assignee_added' }))).toBeNull();
    expect(automationProblem(draft({ actionValue: ' ' }))).toBe('actionValueRequired');
    expect(automationProblem(draft({ actionType: 'comment', actionValue: 'x'.repeat(2000) }))).toBeNull();
    expect(automationProblem(draft({ actionType: 'comment', actionValue: 'x'.repeat(2001) }))).toBe('commentTooLong');
    expect(automationProblem(draft({ actionType: 'webhook', actionValue: 'ftp://hooks.example.com' }))).toBe('webhookHttps');
    expect(automationProblem(draft({ actionType: 'webhook', actionValue: `https://hooks.example.com/${'a'.repeat(2048)}` }))).toBe('webhookTooLong');
    expect(automationProblem(draft({ actionType: 'webhook', actionValue: 'https://hooks.example.com/orbit' }))).toBeNull();
    expect(automationProblem(draft({ actionType: 'notify', actionValue: 'users', actionUserIds: [] }))).toBe('usersRequired');
    expect(automationProblem(draft({ actionType: 'notify', actionValue: 'watchers' }))).toBeNull();
    expect(isHttpsUrl('https://')).toBe(false);
    expect(isHttpsUrl('javascript:alert(1)')).toBe(false);
  });

  it('sends null for an open trigger value, all lists and people only for chosen-people notifications', () => {
    expect(draftToInput(draft({ triggerType: 'task_created', triggerValue: 'stale', listId: '' }))).toEqual({ name: 'Rule', listId: null, triggerType: 'task_created', triggerValue: null, actionType: 'assign', actionValue: 'u1', actionUserIds: [] });
    expect(draftToInput(draft({ triggerType: 'priority_changed', triggerValue: '' })).triggerValue).toBeNull();
    expect(draftToInput(draft({ actionType: 'notify', actionValue: 'assignees', actionUserIds: ['u1'] })).actionUserIds).toEqual([]);
    expect(draftToInput(draft({ actionType: 'notify', actionValue: 'users', actionUserIds: ['u1'] })).actionUserIds).toEqual(['u1']);
    expect(draftToInput(draft({ rotateSecret: true }))).toHaveProperty('rotateSecret', true);
    expect(draftToInput(draft({}))).not.toHaveProperty('rotateSecret');
  });

  it('offers the statuses of the chosen list space, or of every space for all lists', () => {
    const other = adminSpace({ id: 's2', name: 'Ops', lists: [{ id: 'l9', spaceId: 's2', folderId: null, name: 'Ops list', kind: 'list' }], statuses: [{ name: 'triage', color: '#000000', type: 'open', order: 0 }] });
    expect(automationStatusNames([adminSpace(), other], 'l9')).toEqual(['triage']);
    const all = automationStatusNames([adminSpace(), other], '');
    expect(all).toContain('triage');
    expect(all).toContain('blocked by client');
    expect(new Set(all).size).toBe(all.length);
  });

  it('reads the run reasons, with the webhook status code and a fallback', () => {
    expect(describeRunReason(null)).toBeNull();
    expect(describeRunReason('webhook_status_404')).toEqual({ key: 'webhook_status', values: { code: '404' } });
    expect(describeRunReason('no_change')).toEqual({ key: 'no_change' });
    expect(describeRunReason('webhook_status_abc')).toEqual({ key: 'error' });
    expect(describeRunReason('something_new')).toEqual({ key: 'error' });
  });

  it.each([
    ['AUTOMATION_SECRET_KEY_MISSING', 'automationSecretKeyMissing'],
    ['AUTOMATION_WEBHOOK_URL_INVALID', 'automationWebhookUrlInvalid'],
    ['AUTOMATION_WEBHOOK_URL_PRIVATE', 'automationWebhookUrlPrivate'],
    ['AUTOMATION_INVALID', 'automationInvalid'],
  ])('maps %s whether it comes as a code or inside the message', (code, key) => {
    expect(describeApiError(new ApiError(400, 'Bad Request', code))).toEqual({ key });
    expect(describeApiError(new ApiError(400, `Automation rejected: ${code}`))).toEqual({ key });
    expect(describeApiError(new ApiError(400, code))).toEqual({ key });
  });

  it('keeps the old mapping for messages without an automation code', () => {
    expect(describeApiError(new ApiError(400, 'GitHub refresh: GITHUB_REFRESH_COOLDOWN'))).toEqual({ key: 'githubCooldown' });
    expect(describeApiError(new ApiError(403, 'Forbidden', 'SOMETHING_ELSE'))).toEqual({ key: 'forbidden' });
  });

  it('reads the error code from the response body', async () => {
    vi.stubGlobal('window', { location: { pathname: '/admin/automations', assign: vi.fn() } });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ message: 'Webhook URL rejected', code: 'AUTOMATION_WEBHOOK_URL_PRIVATE' }), { status: 400 })),
    );
    const failure = await api('/automations', { method: 'POST', body: '{}' }).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(ApiError);
    expect((failure as ApiError).code).toBe('AUTOMATION_WEBHOOK_URL_PRIVATE');
    expect(describeApiError(failure)).toEqual({ key: 'automationWebhookUrlPrivate' });
  });
});
