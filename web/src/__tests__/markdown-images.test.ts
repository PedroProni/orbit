// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderMarkdown } from '@/lib/markdown';

describe('inline task files in markdown', () => {
  it('sends a stored image through the same origin prefix', () => {
    const html = renderMarkdown('![foto](/attachments/abc/content)');
    expect(html).toContain('src="/backend/attachments/abc/content"');
  });

  it('sends a stored file link through the same origin prefix', () => {
    expect(renderMarkdown('[nota](/attachments/abc/content)')).toContain('href="/backend/attachments/abc/content"');
  });

  it('leaves external images and other paths alone', () => {
    expect(renderMarkdown('![x](https://a.io/i.png)')).toContain('src="https://a.io/i.png"');
    expect(renderMarkdown('[x](/lists/1)')).toContain('href="/lists/1"');
    expect(renderMarkdown('[x](/attachments/abc/content/../../x)')).not.toContain('/backend/');
  });

  it('still strips a script from markdown with an image', () => {
    const html = renderMarkdown('![x](/attachments/abc/content)<script>alert(1)</script>');
    expect(html).not.toContain('<script');
  });
});
