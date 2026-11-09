import { InlineFilesPlanner } from './inline-files.planner';
import { InlineFileAttachment, InlineFileOwner, InlineFileSource } from './inline-files.type';

const URL_A = 'https://t9.p.clickup-attachments.com/t9/a/shot.png';
const URL_B = 'https://t9.p.clickup-attachments.com/t9/b/report.pdf';
const owner = (text: string, over: Partial<InlineFileOwner> = {}): InlineFileOwner => ({ kind: 'task', id: 't1', workspaceId: 'w1', taskId: 't1', text, ...over });
const sources: InlineFileSource[] = [{ id: 'a1', url: URL_A }, { id: 'b1', url: URL_B }];
const attachments: InlineFileAttachment[] = [
  { id: 'a1', taskId: 't1', filename: 'shot.png', mimeType: 'image/png', confirmed: true },
  { id: 'b1', taskId: 't1', filename: 'report (final)!.pdf', mimeType: 'application/pdf', confirmed: true },
];

describe('InlineFilesPlanner', () => {
  it('swaps the address of a markdown image and keeps its text', () => {
    const plan = InlineFilesPlanner.plan([owner(`antes ![tela](${URL_A}) depois`)], sources, attachments);
    expect(plan.changes[0].after).toBe('antes ![tela](/attachments/a1/content) depois');
    expect(plan.changes[0].before).toBe(`antes ![tela](${URL_A}) depois`);
    expect(plan.changes[0].links).toEqual([{ url: URL_A, attachmentId: 'a1' }]);
    expect(plan.links).toBe(1);
    expect(plan.unmatched).toEqual([]);
  });

  it('turns a bare image address into a markdown image', () => {
    const plan = InlineFilesPlanner.plan([owner(`veja ${URL_A} agora`, { kind: 'comment', id: 'c1' })], sources, attachments);
    expect(plan.changes[0]).toMatchObject({ kind: 'comment', id: 'c1', taskId: 't1', workspaceId: 'w1', after: 'veja ![shot.png](/attachments/a1/content) agora' });
  });

  it('turns a bare file address into a plain link with a safe label', () => {
    const plan = InlineFilesPlanner.plan([owner(URL_B)], sources, attachments);
    expect(plan.changes[0].after).toBe('[report final .pdf](/attachments/b1/content)');
  });

  it('uses a fallback label when the name has nothing left', () => {
    const plan = InlineFilesPlanner.plan([owner(URL_B)], sources, [{ id: 'b1', taskId: 't1', filename: '[]()', mimeType: 'application/pdf', confirmed: true }]);
    expect(plan.changes[0].after).toBe('[arquivo](/attachments/b1/content)');
  });

  it('matches an address that still carries its view token', () => {
    const plan = InlineFilesPlanner.plan([owner(`![x](${URL_A}?authz_token=open)`)], sources, attachments);
    expect(plan.changes[0].after).toBe('![x](/attachments/a1/content)');
    expect(plan.changes[0].links[0].url).toBe(URL_A);
  });

  it('rewrites every link of one owner and counts them all', () => {
    const plan = InlineFilesPlanner.plan([owner(`![a](${URL_A}) e ![b](${URL_B})`)], sources, attachments);
    expect(plan.changes).toHaveLength(1);
    expect(plan.links).toBe(2);
    expect(plan.changes[0].after).toBe('![a](/attachments/a1/content) e ![b](/attachments/b1/content)');
  });

  it('leaves an unknown address in place and reports it', () => {
    const unknown = 'https://t9.p.clickup-attachments.com/t9/zz/none.png';
    const plan = InlineFilesPlanner.plan([owner(`![x](${unknown})`)], sources, attachments);
    expect(plan.changes).toEqual([]);
    expect(plan.unmatched).toEqual([{ kind: 'task', id: 't1', url: unknown, reason: 'no-source' }]);
  });

  it('refuses a file that was not stored', () => {
    const plan = InlineFilesPlanner.plan([owner(URL_A)], sources, [{ ...attachments[0], confirmed: false }]);
    expect(plan.changes).toEqual([]);
    expect(plan.unmatched[0].reason).toBe('not-stored');
  });

  it('refuses a source with no attachment record', () => {
    const plan = InlineFilesPlanner.plan([owner(URL_A)], sources, []);
    expect(plan.unmatched[0].reason).toBe('not-stored');
  });

  it('never points a text at a file of another task', () => {
    const plan = InlineFilesPlanner.plan([owner(URL_A, { taskId: 't2', id: 't2' })], sources, attachments);
    expect(plan.changes).toEqual([]);
    expect(plan.unmatched[0]).toMatchObject({ id: 't2', reason: 'other-task' });
  });

  it('keeps the good link when another link of the same text is refused', () => {
    const unknown = 'https://t9.p.clickup-attachments.com/t9/zz/none.png';
    const plan = InlineFilesPlanner.plan([owner(`![a](${URL_A}) ![b](${unknown})`)], sources, attachments);
    expect(plan.changes[0].after).toBe(`![a](/attachments/a1/content) ![b](${unknown})`);
    expect(plan.unmatched).toHaveLength(1);
  });

  it('ignores texts without file links, so a second run changes nothing', () => {
    const plan = InlineFilesPlanner.plan([owner('![a](/attachments/a1/content) https://example.com/x.png')], sources, attachments);
    expect(plan).toEqual({ changes: [], unmatched: [], links: 0 });
  });
});
