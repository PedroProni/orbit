// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { MEMBERS, makeSpace, makeTask } from '../helpers/fixtures';
import { TaskTimeline } from '@/components/tasks/task-timeline';
import { actorName, linkChanges, mergeTimeline, pullRequestChange, visibleActivityFields } from '@/components/tasks/task-timeline.helpers';
import { orbitService } from '@/services/orbit.service';
import { useSessionStore } from '@/stores/session.store';
import { Principal, TaskActivityEntry, TaskComment } from '@/types/api.types';

const STATUSES = makeSpace().statuses;
const comment = (over: Partial<TaskComment>): TaskComment => ({ id: 'c1', taskId: 't1', authorId: 'u1', bodyMd: 'Primeiro comentário', dailyLogDate: null, editedAt: null, createdAt: '2026-03-02T12:00:00Z', ...over });
const entry = (over: Partial<TaskActivityEntry>): TaskActivityEntry => ({ id: 'e1', action: 'task.updated', actorId: 'u2', diff: {}, createdAt: '2026-03-02T11:00:00Z', ...over });
const principal = (role: string) => ({ ...MEMBERS[0], role, workspaceId: 'w', scopes: [] }) as Principal;

describe('timeline helpers', () => {
  it('merges comments and activity oldest first', () => {
    const items = mergeTimeline([comment({ createdAt: '2026-03-02T12:00:00Z' })], [entry({ createdAt: '2026-03-03T09:00:00Z' }), entry({ id: 'e0', createdAt: '2026-03-01T09:00:00Z' })]);
    expect(items.map((item) => item.id)).toEqual(['a-e0', 'c-c1', 'a-e1']);
  });

  it('keeps only known fields and lists the link slots that changed', () => {
    expect(visibleActivityFields(entry({ diff: { status: { before: 'a', after: 'b' }, updatedAt: { before: 1, after: 2 }, mystery: { before: 1, after: 2 } } }))).toEqual(['status']);
    expect(linkChanges({ figma: null, notion: 'https://n.so/a' }, { figma: 'https://f.com/x', notion: 'https://n.so/a', printsFolder: '' })).toEqual([{ key: 'figma', before: '-', after: 'https://f.com/x' }]);
  });

  it('names the actor, with GitHub for the webhook, Automation for the rules and a fallback for an unknown id', () => {
    const labels = { github: 'GitHub', automation: 'Automation', someone: 'Someone' };
    expect(actorName('u1', MEMBERS, labels)).toBe('Ana Souza');
    expect(actorName('github', MEMBERS, labels)).toBe('GitHub');
    expect(actorName('automation', MEMBERS, labels)).toBe('Automation');
    expect(actorName('gone', MEMBERS, labels)).toBe('Someone');
  });

  it('reads a pull request entry as linked or unlinked, and ignores mixed or empty diffs', () => {
    const linked = entry({ diff: { pullRequests: { before: null, after: 'acme-org/orbit#12' } } });
    expect(pullRequestChange(linked, ['pullRequests'])).toEqual({ kind: 'linked', pr: 'acme-org/orbit#12' });
    expect(pullRequestChange(entry({ diff: { pullRequests: { before: 'acme-org/orbit#12', after: null } } }), ['pullRequests'])).toEqual({ kind: 'unlinked', pr: 'acme-org/orbit#12' });
    expect(pullRequestChange(entry({ diff: { pullRequests: { before: null, after: null } } }), ['pullRequests'])).toBeNull();
    expect(pullRequestChange(linked, ['pullRequests', 'status'])).toBeNull();
  });
});

describe('TaskTimeline', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useSessionStore.setState({ authenticated: true, hydrated: true });
    vi.spyOn(orbitService, 'members').mockResolvedValue(MEMBERS);
    vi.spyOn(orbitService, 'customFields').mockResolvedValue([]);
  });

  it('shows comments and activity in one list with day separators and the composer at the bottom', async () => {
    vi.spyOn(orbitService, 'me').mockResolvedValue(principal('member'));
    vi.spyOn(orbitService, 'comments').mockResolvedValue([comment({})]);
    vi.spyOn(orbitService, 'attachments').mockResolvedValue([]);
    vi.spyOn(orbitService, 'taskActivity').mockResolvedValue([entry({ diff: { status: { before: 'to-do', after: 'doing' } } }), entry({ id: 'e2', action: 'task.created', createdAt: '2026-03-01T12:00:00Z' })]);
    renderWithProviders(<TaskTimeline task={makeTask()} statuses={STATUSES} readOnly={false} limited={false} />);
    await screen.findByText('Primeiro comentário');
    await waitFor(() => expect(screen.getAllByRole('separator')).toHaveLength(2));
    const kinds = Array.from(document.querySelectorAll('[data-kind]')).map((node) => node.getAttribute('data-kind'));
    expect(kinds).toEqual(['activity', 'activity', 'comment']);
    const statusLine = document.querySelectorAll('[data-kind="activity"]')[1];
    expect(statusLine.textContent).toContain('changed status from');
    expect(statusLine.querySelectorAll('span[aria-hidden="true"]')).toHaveLength(2);
    expect(screen.getByRole('form', { name: 'Write a comment (markdown)' })).toBeTruthy();
    expect(screen.getByText(/^Created /)).toBeTruthy();
  });

  it('reads pull request entries as sentences and names GitHub as the actor', async () => {
    vi.spyOn(orbitService, 'me').mockResolvedValue(principal('member'));
    vi.spyOn(orbitService, 'comments').mockResolvedValue([]);
    vi.spyOn(orbitService, 'attachments').mockResolvedValue([]);
    vi.spyOn(orbitService, 'taskActivity').mockResolvedValue([
      entry({ id: 'e3', action: 'task.pull_request_linked', actorId: 'github', diff: { pullRequests: { before: null, after: 'acme-org/orbit#15' } } }),
      entry({ id: 'e4', action: 'task.pull_request_unlinked', createdAt: '2026-03-02T11:30:00Z', diff: { pullRequests: { before: 'acme-org/orbit#15', after: null } } }),
    ]);
    renderWithProviders(<TaskTimeline task={makeTask()} statuses={STATUSES} readOnly={false} limited={false} />);
    const lines = () => Array.from(document.querySelectorAll('[data-kind="activity"]')).map((node) => node.querySelector('div')?.textContent);
    await waitFor(() => expect(lines()).toEqual(['GitHub linked pull request acme-org/orbit#15', 'Bruno Lima unlinked pull request acme-org/orbit#15']));
  });

  it('names Automation with the bot icon as the actor of a change made by an automation, in both languages', async () => {
    vi.spyOn(orbitService, 'me').mockResolvedValue(principal('member'));
    vi.spyOn(orbitService, 'comments').mockResolvedValue([comment({ authorId: 'automation', bodyMd: 'Lembrete automático' })]);
    vi.spyOn(orbitService, 'attachments').mockResolvedValue([]);
    vi.spyOn(orbitService, 'taskActivity').mockResolvedValue([entry({ id: 'e5', actorId: 'automation', diff: { priority: { before: 'low', after: 'urgent' } } })]);
    const { unmount } = renderWithProviders(<TaskTimeline task={makeTask()} statuses={STATUSES} readOnly={false} limited={false} />);
    const activityLine = () => document.querySelector('[data-kind="activity"]');
    await waitFor(() => expect(activityLine()?.querySelector('div')?.textContent).toBe('Automation changed prioritypriority: Low -> Urgent'));
    expect(activityLine()?.querySelector('[data-actor="automation"] svg')).toBeTruthy();
    const commentLine = await waitFor(() => document.querySelector('[data-kind="comment"]') as HTMLElement);
    expect(commentLine.querySelector('[data-actor="automation"]')?.getAttribute('aria-label')).toBe('Automation');
    expect(screen.queryByText('Someone')).toBeNull();
    unmount();
    renderWithProviders(<TaskTimeline task={makeTask()} statuses={STATUSES} readOnly={false} limited={false} />, 'pt');
    await waitFor(() => expect(document.querySelector('[data-kind="activity"] [data-actor="automation"]')?.textContent).toBe('Automação'));
  });

  it('shows the empty state when the task has no comments or activity yet', async () => {
    vi.spyOn(orbitService, 'me').mockResolvedValue(principal('member'));
    vi.spyOn(orbitService, 'comments').mockResolvedValue([]);
    vi.spyOn(orbitService, 'attachments').mockResolvedValue([]);
    vi.spyOn(orbitService, 'taskActivity').mockResolvedValue([]);
    renderWithProviders(<TaskTimeline task={makeTask()} statuses={STATUSES} readOnly={false} limited={false} />);
    expect(await screen.findByText('No activity yet')).toBeTruthy();
    expect(document.querySelectorAll('[data-kind]')).toHaveLength(0);
  });

  it('asks a guest for no comments, attachments or fields and shows no composer', async () => {
    vi.spyOn(orbitService, 'me').mockResolvedValue(principal('guest'));
    const comments = vi.spyOn(orbitService, 'comments').mockResolvedValue([]);
    const attachments = vi.spyOn(orbitService, 'attachments').mockResolvedValue([]);
    const activity = vi.spyOn(orbitService, 'taskActivity').mockResolvedValue([entry({ action: 'task.created' })]);
    renderWithProviders(<TaskTimeline task={makeTask()} statuses={STATUSES} readOnly limited />);
    await waitFor(() => expect(activity).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(comments).not.toHaveBeenCalled();
    expect(attachments).not.toHaveBeenCalled();
    expect(orbitService.customFields).not.toHaveBeenCalled();
    expect(screen.queryByRole('form', { name: 'Write a comment (markdown)' })).toBeNull();
  });
});
