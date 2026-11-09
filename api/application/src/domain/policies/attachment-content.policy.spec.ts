import { AttachmentContentPolicy } from './attachment-content.policy';

describe('AttachmentContentPolicy', () => {
  it('builds the address used inside task text', () => {
    expect(AttachmentContentPolicy.path('a1')).toBe('/attachments/a1/content');
  });

  it('finds a file shown in the text', () => {
    expect(AttachmentContentPolicy.isShownIn('antes ![x](/attachments/a1/content) depois', 'a1')).toBe(true);
  });

  it('does not take another file, a similar id or a bare id for a shown file', () => {
    expect(AttachmentContentPolicy.isShownIn('![x](/attachments/a2/content)', 'a1')).toBe(false);
    expect(AttachmentContentPolicy.isShownIn('![x](/attachments/a11/content)', 'a1')).toBe(false);
    expect(AttachmentContentPolicy.isShownIn('a1', 'a1')).toBe(false);
    expect(AttachmentContentPolicy.isShownIn('', 'a1')).toBe(false);
  });
});
