export const ATTACHMENT_CONTENT_PATH = /^\/attachments\/[^/?#]+\/content$/;

export const MARKDOWN_SANITIZE_CONFIG = { USE_PROFILES: { html: true }, FORBID_TAGS: ['style', 'form', 'input', 'iframe'], FORBID_ATTR: ['style'] };
