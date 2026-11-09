import { AttachmentGallery } from '@domain/enums/attachment.enums';
import { AttachmentGalleryPolicy } from './attachment-gallery.policy';

describe('AttachmentGalleryPolicy', () => {
  it('aceita qualquer anexo fora da galeria', () => {
    expect(AttachmentGalleryPolicy.accepts(null, 'application/pdf', 'c1')).toBe(true);
  });

  it('aceita só imagens da tarefa na galeria de prints', () => {
    expect(AttachmentGalleryPolicy.accepts(AttachmentGallery.PRINTS, 'image/png', null)).toBe(true);
    expect(AttachmentGalleryPolicy.accepts(AttachmentGallery.PRINTS, ' IMAGE/WEBP', null)).toBe(true);
    expect(AttachmentGalleryPolicy.accepts(AttachmentGallery.PRINTS, 'application/pdf', null)).toBe(false);
    expect(AttachmentGalleryPolicy.accepts(AttachmentGallery.PRINTS, 'text/html', null)).toBe(false);
    expect(AttachmentGalleryPolicy.accepts(AttachmentGallery.PRINTS, 'image/png', 'c1')).toBe(false);
  });
});
