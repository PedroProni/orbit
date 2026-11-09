import DOMPurify from 'dompurify';
import { marked, Token } from 'marked';
import { API_BASE } from '@/config/app.constants';
import { ATTACHMENT_CONTENT_PATH, MARKDOWN_SANITIZE_CONFIG } from '@/lib/markdown.constants';

const withApiBase = (token: Token): void => {
  if ((token.type === 'image' || token.type === 'link') && ATTACHMENT_CONTENT_PATH.test(token.href)) token.href = `${API_BASE}${token.href}`;
};

export function renderMarkdown(source: string): string {
  if (typeof window === 'undefined' || !DOMPurify.isSupported) return '';
  const html = marked.parse(source ?? '', { async: false, gfm: true, breaks: true, walkTokens: withApiBase }) as string;
  return DOMPurify.sanitize(html, MARKDOWN_SANITIZE_CONFIG);
}
