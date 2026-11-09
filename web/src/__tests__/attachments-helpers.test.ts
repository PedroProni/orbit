import { describe, expect, it } from 'vitest';
import { extensionOf, formatBytes, isImageMime, mimeOf, validateFile } from '@/components/attachments/attachments.helpers';
import { ATTACHMENT_MAX_BYTES } from '@/components/attachments/attachments.constants';

const fileOf = (name: string, size: number, type = 'text/plain') => {
  const f = new File(['x'], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
};

describe('attachment helpers', () => {
  it('formats bytes in B, KB and MB', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(5242880)).toBe('5.0 MB');
  });

  it('reads the extension and mime with a fallback', () => {
    expect(extensionOf('Report.PDF')).toBe('pdf');
    expect(extensionOf('noext')).toBe('');
    expect(mimeOf(fileOf('a.bin', 1, ''))).toBe('application/octet-stream');
    expect(isImageMime('image/png')).toBe(true);
    expect(isImageMime('application/pdf')).toBe(false);
  });

  it('accepts a normal file', () => {
    expect(validateFile(fileOf('a.png', 100, 'image/png')).errorKey).toBeNull();
    expect(validateFile(fileOf('a.txt', ATTACHMENT_MAX_BYTES)).errorKey).toBeNull();
  });

  it('rejects empty, oversized and blocked files', () => {
    expect(validateFile(fileOf('a.txt', 0)).errorKey).toBe('empty');
    expect(validateFile(fileOf('a.txt', ATTACHMENT_MAX_BYTES + 1)).errorKey).toBe('tooLarge');
    expect(validateFile(fileOf('setup.EXE', 10))).toEqual({ errorKey: 'blockedType', values: { name: 'setup.EXE', ext: 'exe' } });
  });
});
