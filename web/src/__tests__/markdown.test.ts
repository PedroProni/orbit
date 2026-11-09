// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderMarkdown } from '@/lib/markdown';

describe('renderMarkdown', () => {
  it('removes script tags and event handlers', () => {
    const html = renderMarkdown('<script>alert(1)</script>\n\n<img src=x onerror="alert(2)">\n\n**ok**');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('onerror');
    expect(html).toContain('<strong>ok</strong>');
  });

  it('neutralizes javascript links', () => {
    const html = renderMarkdown('[x](javascript:alert(1))');
    expect(html.toLowerCase()).not.toContain('javascript:');
  });

  it('removes iframes and inline styles', () => {
    const html = renderMarkdown('<iframe src="https://evil"></iframe><p style="position:fixed">a</p>');
    expect(html).not.toContain('iframe');
    expect(html).not.toContain('style=');
  });
});
