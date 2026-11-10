// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { chooseOption } from '../helpers/choose-option';
import { MEMBERS } from '../helpers/fixtures';
import { adminSpace, principal } from '../helpers/admin-fixtures';
import { AdminShell } from '@/components/admin/admin-shell';
import { AutomationsAdminPage } from '@/components/admin/automations-admin-page';
import { ApiError } from '@/lib/api-client';
import { automationService } from '@/services/automation.service';
import { Automation, AutomationRun } from '@/services/automation.types';
import { orbitService } from '@/services/orbit.service';
import { useSessionStore } from '@/stores/session.store';

vi.mock('next/navigation', () => ({ usePathname: () => '/admin/automations', useParams: () => ({}), useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));

const automation = (over: Partial<Automation>): Automation => ({
  id: 'a1',
  listId: null,
  name: 'Rule',
  triggerType: 'task_created',
  triggerValue: null,
  actionType: 'assign',
  actionValue: 'u2',
  actionUserIds: [],
  active: true,
  hasSecret: false,
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
  lastRun: null,
  ...over,
});

const WEBHOOK = automation({ id: 'a9', name: 'Deploy hook', actionType: 'webhook', actionValue: 'https://hooks.example.com/orbit', hasSecret: true, lastRun: { status: 'failed', reason: 'webhook_status_502', at: '2026-11-08T10:00:00.000Z' } });

const ALL: Automation[] = [
  automation({ id: 'a1', name: 'Triage' }),
  automation({ id: 'a2', name: 'Review flow', listId: 'l1', triggerType: 'status_changed', triggerValue: 'in review', actionType: 'set_status', actionValue: 'completed' }),
  automation({ id: 'a3', name: 'Hot tag', listId: 'gone', triggerType: 'priority_changed', triggerValue: null, actionType: 'add_tag', actionValue: 'hot', active: false }),
  automation({ id: 'a4', name: 'Escalate', triggerType: 'priority_changed', triggerValue: 'urgent', actionType: 'set_priority', actionValue: 'high' }),
  automation({ id: 'a5', name: 'Welcome', triggerType: 'assignee_added', triggerValue: null, actionType: 'comment', actionValue: 'Hello' }),
  automation({ id: 'a6', name: 'Ana assigned', triggerType: 'assignee_added', triggerValue: 'u1', actionType: 'notify', actionValue: 'assignees' }),
  automation({ id: 'a7', name: 'Due', triggerType: 'date_reached', triggerValue: 'due_date', actionType: 'notify', actionValue: 'watchers' }),
  automation({ id: 'a8', name: 'Start', triggerType: 'date_reached', triggerValue: 'start_date', actionType: 'notify', actionValue: 'users', actionUserIds: ['u1', 'u2'] }),
  WEBHOOK,
];

const rowOf = (name: string) => screen.getByText(name, { selector: 'p' }).closest('li') as HTMLElement;
const dialog = () => screen.getByRole('dialog');

const setup = async (list: Automation[] = ALL) => {
  vi.spyOn(automationService, 'list').mockResolvedValue(list);
  renderWithProviders(
    <AdminShell>
      <AutomationsAdminPage />
    </AdminShell>,
  );
  if (list.length) await screen.findByText(list[0].name, { selector: 'p' });
};

describe('automations administration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useSessionStore.setState({ authenticated: true, hydrated: true });
    vi.spyOn(orbitService, 'me').mockResolvedValue(principal('admin'));
    vi.spyOn(orbitService, 'hierarchy').mockResolvedValue([adminSpace()]);
    vi.spyOn(orbitService, 'members').mockResolvedValue(MEMBERS);
  });
  afterEach(() => cleanup());

  it.each(['member', 'guest'])('refuses a %s and never asks for the automations', async (role) => {
    vi.spyOn(orbitService, 'me').mockResolvedValue(principal(role));
    const list = vi.spyOn(automationService, 'list').mockResolvedValue(ALL);
    renderWithProviders(
      <AdminShell>
        <AutomationsAdminPage />
      </AdminShell>,
    );
    expect(await screen.findByText('You do not have access to this page')).toBeTruthy();
    expect(list).not.toHaveBeenCalled();
  });

  it('shows the Automation group in the admin navigation with the page marked', async () => {
    await setup();
    const nav = screen.getByRole('navigation', { name: 'Administration sections' });
    expect(nav.textContent).toContain('Automation');
    const link = within(nav).getByRole('link', { name: 'Automations' });
    expect(link.getAttribute('href')).toBe('/admin/automations');
    expect(link.getAttribute('aria-current')).toBe('page');
  });

  it('reads every trigger and action as a plain sentence with the scope', async () => {
    await setup();
    const sentence = (name: string) => within(rowOf(name)).getAllByText(/^When /)[0].textContent;
    expect(sentence('Triage')).toBe('When a task is created, assign Bruno Lima.');
    expect(sentence('Review flow')).toBe('When a task moves to In review, move it to Completed.');
    expect(sentence('Hot tag')).toBe('When the priority changes, add the tag hot.');
    expect(sentence('Escalate')).toBe('When the priority changes to Urgent, set the priority to High.');
    expect(sentence('Welcome')).toBe('When someone is assigned, post a comment.');
    expect(sentence('Ana assigned')).toBe('When Ana Souza is assigned, notify the assignees.');
    expect(sentence('Due')).toBe('When the due date arrives, notify the watchers.');
    expect(sentence('Start')).toBe('When the start date arrives, notify Ana Souza, Bruno Lima.');
    expect(sentence('Deploy hook')).toBe('When a task is created, call the webhook at hooks.example.com.');
    expect(within(rowOf('Triage')).getByText('All lists')).toBeTruthy();
    expect(within(rowOf('Review flow')).getByText('Engineering / Backlog list')).toBeTruthy();
    expect(within(rowOf('Hot tag')).getByText('A list that no longer exists')).toBeTruthy();
    expect(within(rowOf('Triage')).getByText('Never ran')).toBeTruthy();
    const badge = within(rowOf('Deploy hook')).getByText('Failed');
    expect(badge.getAttribute('title')).toBe('The webhook answered with status 502');
  });

  it('reads the sentence in Portuguese', async () => {
    vi.spyOn(automationService, 'list').mockResolvedValue([ALL[1], ALL[7]]);
    renderWithProviders(
      <AdminShell>
        <AutomationsAdminPage />
      </AdminShell>,
      'pt',
    );
    expect(await screen.findByText('Quando uma tarefa passa para Em revisão, mover para Concluída.')).toBeTruthy();
    expect(screen.getByText('Quando chega a data de início, notificar Ana Souza, Bruno Lima.')).toBeTruthy();
    expect(screen.getAllByText('Nunca executou')).toHaveLength(2);
  });

  it('shows the empty, loading and error states', async () => {
    let release: (value: Automation[]) => void = () => undefined;
    vi.spyOn(automationService, 'list').mockReturnValueOnce(new Promise((resolve) => (release = resolve)));
    const { unmount } = renderWithProviders(
      <AdminShell>
        <AutomationsAdminPage />
      </AdminShell>,
    );
    await screen.findByRole('navigation', { name: 'Administration sections' });
    const region = screen.getByRole('region', { name: 'Automations' });
    await waitFor(() => expect(region.querySelector('.skeleton')).toBeTruthy());
    expect(screen.queryByText('No automations yet')).toBeNull();
    release([]);
    expect(await screen.findByText('No automations yet')).toBeTruthy();
    expect(region.querySelector('.skeleton')).toBeNull();
    expect(screen.getByText('Create one to save the repetitive steps of your team.')).toBeTruthy();
    unmount();
    vi.spyOn(automationService, 'list').mockRejectedValue(new ApiError(500, 'boom'));
    renderWithProviders(
      <AdminShell>
        <AutomationsAdminPage />
      </AdminShell>,
    );
    expect(await screen.findByText('It was not possible to load this page. Try again.')).toBeTruthy();
  });

  it('turns an automation off and back on through the switch', async () => {
    await setup();
    const update = vi.spyOn(automationService, 'update').mockResolvedValue({ ...ALL[0], active: false });
    const on = within(rowOf('Triage')).getByRole('switch', { name: 'Turn automation Triage on or off' });
    expect(on.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(on);
    await waitFor(() => expect(update).toHaveBeenCalledWith('a1', { active: false }));
    const off = within(rowOf('Hot tag')).getByRole('switch');
    expect(off.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(off);
    await waitFor(() => expect(update).toHaveBeenCalledWith('a3', { active: true }));
  });

  it('shows a refused toggle as a translated error on the row', async () => {
    await setup();
    vi.spyOn(automationService, 'update').mockRejectedValue(new ApiError(403, 'Forbidden'));
    fireEvent.click(within(rowOf('Triage')).getByRole('switch'));
    expect(await within(rowOf('Triage')).findByRole('alert')).toHaveProperty('textContent', 'You do not have permission to do this');
  });

  it('deletes only after the confirmation', async () => {
    await setup();
    const remove = vi.spyOn(automationService, 'remove').mockResolvedValue(undefined);
    fireEvent.click(screen.getByRole('button', { name: 'Delete automation Triage' }));
    expect(within(dialog()).getByText('Delete the automation Triage? Its run history goes with it.')).toBeTruthy();
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(remove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Delete automation Triage' }));
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(remove).toHaveBeenCalledWith('a1'));
  });

  it('edits an automation with its values filled in and sends the whole rule', async () => {
    await setup();
    const update = vi.spyOn(automationService, 'update').mockResolvedValue({ ...ALL[1], name: 'Review done' });
    fireEvent.click(screen.getByRole('button', { name: 'Edit automation Review flow' }));
    const name = within(dialog()).getByLabelText('Name') as HTMLInputElement;
    expect(name.value).toBe('Review flow');
    expect(within(dialog()).getByRole('combobox', { name: 'Runs on' }).textContent).toContain('Engineering / Backlog list');
    expect(within(dialog()).getByRole('combobox', { name: 'Trigger' }).textContent).toContain('The status changes');
    expect(within(dialog()).getByRole('combobox', { name: 'Action' }).textContent).toContain('Change the status');
    expect(within(dialog()).queryByText('Generate a new secret')).toBeNull();
    fireEvent.change(name, { target: { value: 'Review done' } });
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(update).toHaveBeenCalledWith('a2', { name: 'Review done', listId: 'l1', triggerType: 'status_changed', triggerValue: 'in review', actionType: 'set_status', actionValue: 'completed', actionUserIds: [] }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('validates the required values, the comment counter, the people to notify and the https webhook before sending', async () => {
    await setup();
    const create = vi.spyOn(automationService, 'create');
    fireEvent.click(screen.getByRole('button', { name: 'New automation' }));
    const submit = () => fireEvent.click(within(dialog()).getByRole('button', { name: 'Create' }));
    const alertText = () => within(dialog()).getByRole('alert').textContent;
    submit();
    expect(alertText()).toBe('Give the automation a name.');
    fireEvent.change(within(dialog()).getByLabelText('Name'), { target: { value: 'Review' } });
    chooseOption(within(dialog()).getByRole('combobox', { name: 'Trigger' }), 'The status changes');
    submit();
    expect(alertText()).toBe('Choose the value for the trigger.');
    chooseOption(within(dialog()).getByRole('combobox', { name: 'Status' }), 'In review');
    submit();
    expect(alertText()).toBe('Fill in the value for the action.');
    chooseOption(within(dialog()).getByRole('combobox', { name: 'Action' }), 'Post a comment');
    const comment = within(dialog()).getByLabelText('Comment');
    fireEvent.change(comment, { target: { value: 'x'.repeat(2001) } });
    expect(within(dialog()).getByText('2001/2000').className).toContain('text-danger');
    submit();
    expect(alertText()).toBe('The comment can have up to 2000 characters.');
    fireEvent.change(comment, { target: { value: 'Ready for review' } });
    expect(within(dialog()).getByText('16/2000').className).toContain('text-muted');
    chooseOption(within(dialog()).getByRole('combobox', { name: 'Action' }), 'Send a notification');
    chooseOption(within(dialog()).getByRole('combobox', { name: 'Who gets notified' }), 'Chosen people');
    submit();
    expect(alertText()).toBe('Choose at least one person to notify.');
    chooseOption(within(dialog()).getByRole('combobox', { name: 'Action' }), 'Call a webhook');
    const url = within(dialog()).getByLabelText('Webhook URL');
    fireEvent.change(url, { target: { value: 'http://hooks.example.com/orbit' } });
    submit();
    expect(alertText()).toBe('The webhook address must be a valid https:// link.');
    fireEvent.change(url, { target: { value: 'https://' } });
    submit();
    expect(alertText()).toBe('The webhook address must be a valid https:// link.');
    expect(create).not.toHaveBeenCalled();
  });

  it('creates a notify rule for chosen people on one list and sends only their ids', async () => {
    await setup();
    const create = vi.spyOn(automationService, 'create').mockResolvedValue(automation({ id: 'n1' }));
    fireEvent.click(screen.getByRole('button', { name: 'New automation' }));
    fireEvent.change(within(dialog()).getByLabelText('Name'), { target: { value: '  Kickoff  ' } });
    chooseOption(within(dialog()).getByRole('combobox', { name: 'Runs on' }), 'Engineering / Sprint 12');
    chooseOption(within(dialog()).getByRole('combobox', { name: 'Trigger' }), 'Someone is assigned');
    chooseOption(within(dialog()).getByRole('combobox', { name: 'Action' }), 'Send a notification');
    chooseOption(within(dialog()).getByRole('combobox', { name: 'Who gets notified' }), 'Chosen people');
    fireEvent.click(within(dialog()).getByRole('checkbox', { name: 'Bruno Lima' }));
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(create).toHaveBeenCalledWith({ name: 'Kickoff', listId: 'l2', triggerType: 'assignee_added', triggerValue: null, actionType: 'notify', actionValue: 'users', actionUserIds: ['u2'] }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('shows the webhook secret once after creating, with copy and a warning', async () => {
    await setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const create = vi.spyOn(automationService, 'create').mockResolvedValue({ ...WEBHOOK, id: 'w2', webhookSecret: 'whsec_created_123' });
    fireEvent.click(screen.getByRole('button', { name: 'New automation' }));
    fireEvent.change(within(dialog()).getByLabelText('Name'), { target: { value: 'Ship hook' } });
    chooseOption(within(dialog()).getByRole('combobox', { name: 'Action' }), 'Call a webhook');
    fireEvent.change(within(dialog()).getByLabelText('Webhook URL'), { target: { value: 'https://hooks.example.com/orbit' } });
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(create).toHaveBeenCalledWith({ name: 'Ship hook', listId: null, triggerType: 'task_created', triggerValue: null, actionType: 'webhook', actionValue: 'https://hooks.example.com/orbit', actionUserIds: [] }));
    const secret = await screen.findByRole('dialog', { name: 'Webhook secret' });
    expect((within(secret).getByLabelText('Secret') as HTMLInputElement).value).toBe('whsec_created_123');
    expect(within(secret).getByText('Copy it now. For your safety it will not be shown again.')).toBeTruthy();
    fireEvent.click(within(secret).getByRole('button', { name: 'Copy' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('whsec_created_123'));
    expect(await within(secret).findByRole('button', { name: 'Copied' })).toBeTruthy();
    fireEvent.click(within(secret).getByRole('button', { name: 'I saved it' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.queryByDisplayValue('whsec_created_123')).toBeNull();
    expect(document.body.textContent).not.toContain('whsec_created_123');
  });

  it('does not open the secret dialog when the API returns no secret', async () => {
    await setup();
    vi.spyOn(automationService, 'create').mockResolvedValue(automation({ id: 'n2' }));
    fireEvent.click(screen.getByRole('button', { name: 'New automation' }));
    fireEvent.change(within(dialog()).getByLabelText('Name'), { target: { value: 'Plain' } });
    chooseOption(within(dialog()).getByRole('combobox', { name: 'Person' }), 'Ana Souza');
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('generates a new secret on edit and shows the new one once', async () => {
    await setup();
    const update = vi.spyOn(automationService, 'update').mockResolvedValue({ ...WEBHOOK, webhookSecret: 'whsec_rotated_456' });
    fireEvent.click(screen.getByRole('button', { name: 'Edit automation Deploy hook' }));
    expect(within(dialog()).getByText('The current secret stops working when you save.')).toBeTruthy();
    fireEvent.click(within(dialog()).getByRole('checkbox', { name: /Generate a new secret/ }));
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(update).toHaveBeenCalledWith('a9', expect.objectContaining({ actionType: 'webhook', actionValue: 'https://hooks.example.com/orbit', rotateSecret: true })));
    const secret = await screen.findByRole('dialog', { name: 'Webhook secret' });
    expect((within(secret).getByLabelText('Secret') as HTMLInputElement).value).toBe('whsec_rotated_456');
  });

  it('does not ask to rotate when the secret box is left alone', async () => {
    await setup();
    const update = vi.spyOn(automationService, 'update').mockResolvedValue(WEBHOOK);
    fireEvent.click(screen.getByRole('button', { name: 'Edit automation Deploy hook' }));
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(update).toHaveBeenCalled());
    expect(update.mock.calls[0][1]).not.toHaveProperty('rotateSecret');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it.each([
    ['AUTOMATION_SECRET_KEY_MISSING', 'Webhook secrets are not set up on the server. Ask the person who runs Orbit to configure the key.'],
    ['AUTOMATION_WEBHOOK_URL_INVALID', 'The webhook address must be a valid https:// link.'],
    ['AUTOMATION_WEBHOOK_URL_PRIVATE', 'The webhook address points to a private or internal network.'],
    ['AUTOMATION_INVALID', 'This automation is not valid. Check the trigger and the action.'],
  ])('maps the %s error to a translated message in the dialog', async (code, text) => {
    await setup();
    vi.spyOn(automationService, 'create').mockRejectedValue(new ApiError(400, 'Bad Request', code));
    fireEvent.click(screen.getByRole('button', { name: 'New automation' }));
    fireEvent.change(within(dialog()).getByLabelText('Name'), { target: { value: 'Ship hook' } });
    chooseOption(within(dialog()).getByRole('combobox', { name: 'Action' }), 'Call a webhook');
    fireEvent.change(within(dialog()).getByLabelText('Webhook URL'), { target: { value: 'https://10.0.0.5/hook' } });
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Create' }));
    expect(await within(dialog()).findByText(text)).toBeTruthy();
    expect(screen.getByRole('dialog', { name: 'New automation' })).toBeTruthy();
  });

  it('opens the history with translated reasons, task links and relative times', async () => {
    await setup();
    const runs: AutomationRun[] = [
      { id: 'r1', taskId: 't9', taskTitle: 'Release notes', status: 'failed', reason: 'webhook_status_502', createdAt: new Date(Date.now() - 5 * 60_000).toISOString() },
      { id: 'r2', taskId: 't8', taskTitle: null, status: 'skipped', reason: 'no_change', createdAt: new Date(Date.now() - 2 * 3_600_000).toISOString() },
      { id: 'r3', taskId: 't7', taskTitle: 'Blocked call', status: 'failed', reason: 'webhook_blocked_address', createdAt: new Date(Date.now() - 86_400_000).toISOString() },
      { id: 'r4', taskId: 't6', taskTitle: 'Timeout call', status: 'failed', reason: 'webhook_timeout', createdAt: new Date(Date.now() - 86_400_000).toISOString() },
      { id: 'r5', taskId: 't5', taskTitle: 'Moved', status: 'skipped', reason: 'status_not_in_space', createdAt: new Date(Date.now() - 86_400_000).toISOString() },
      { id: 'r6', taskId: 't4', taskTitle: 'Gone', status: 'failed', reason: 'task_not_found', createdAt: new Date(Date.now() - 86_400_000).toISOString() },
      { id: 'r7', taskId: 't3', taskTitle: 'Odd', status: 'failed', reason: 'mystery_reason', createdAt: new Date(Date.now() - 86_400_000).toISOString() },
      { id: 'r8', taskId: 't2', taskTitle: 'Fine', status: 'done', reason: null, createdAt: new Date(Date.now() - 86_400_000).toISOString() },
    ];
    const fetchRuns = vi.spyOn(automationService, 'runs').mockResolvedValue(runs);
    const row = rowOf('Deploy hook');
    const toggle = within(row).getByRole('button', { name: 'History' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(fetchRuns).not.toHaveBeenCalled();
    fireEvent.click(toggle);
    const history = await within(row).findByRole('list', { name: 'History' });
    expect(fetchRuns).toHaveBeenCalledWith('a9');
    expect(within(history).getByText('The webhook answered with status 502')).toBeTruthy();
    expect(within(history).getByText('Nothing to change')).toBeTruthy();
    expect(within(history).getByText('The webhook address points to a blocked network')).toBeTruthy();
    expect(within(history).getByText('The webhook took too long to answer')).toBeTruthy();
    expect(within(history).getByText('The status does not exist in the task space')).toBeTruthy();
    expect(within(history).getByText('The task no longer exists')).toBeTruthy();
    expect(within(history).getByText('Something went wrong')).toBeTruthy();
    expect(within(history).getByRole('link', { name: 'Release notes' }).getAttribute('href')).toBe('/t/t9');
    expect(within(history).getByRole('link', { name: 'A task that no longer exists' }).getAttribute('href')).toBe('/t/t8');
    expect(within(history).getByText('5 minutes ago')).toBeTruthy();
    expect(within(history).getByText('2 hours ago')).toBeTruthy();
    expect(within(history).getAllByText('Done')).toHaveLength(1);
    expect(within(history).getAllByText('Skipped')).toHaveLength(2);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('shows the empty and failed history', async () => {
    await setup();
    vi.spyOn(automationService, 'runs').mockResolvedValueOnce([]).mockRejectedValueOnce(new ApiError(500, 'boom'));
    fireEvent.click(within(rowOf('Triage')).getByRole('button', { name: 'History' }));
    expect(await within(rowOf('Triage')).findByText('No runs yet.')).toBeTruthy();
    fireEvent.click(within(rowOf('Welcome')).getByRole('button', { name: 'History' }));
    expect(await within(rowOf('Welcome')).findByText('Could not load the history.')).toBeTruthy();
  });
});
