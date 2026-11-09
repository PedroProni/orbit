import { AttachmentGallery } from '@domain/enums/attachment.enums';
import { TaskAttachmentItem } from '@domain/types/task-attachment-item.type';
import { TaskAttachmentSummaryPolicy } from './task-attachment-summary.policy';

describe('TaskAttachmentSummaryPolicy', () => {
  const pdf: TaskAttachmentItem = { id: 'a1', mimeType: 'application/pdf', commentId: null, gallery: null };
  const commentImage: TaskAttachmentItem = { id: 'a2', mimeType: 'image/png', commentId: 'c1', gallery: null };
  const image: TaskAttachmentItem = { id: 'a3', mimeType: ' IMAGE/JPEG ', commentId: null, gallery: null };
  const print: TaskAttachmentItem = { id: 'a4', mimeType: 'image/png', commentId: null, gallery: AttachmentGallery.PRINTS };

  it('counts every file for a member and takes the first task image as the cover, skipping comment images and other files', () => {
    expect(TaskAttachmentSummaryPolicy.summarize([pdf, commentImage, image, print], '', false)).toEqual({ attachmentCount: 4, coverAttachmentId: 'a3' });
  });

  it('has no cover when the task has no image of its own', () => {
    expect(TaskAttachmentSummaryPolicy.summarize([pdf, commentImage], '', false)).toEqual({ attachmentCount: 2, coverAttachmentId: null });
    expect(TaskAttachmentSummaryPolicy.summarize([], '', false)).toEqual({ attachmentCount: 0, coverAttachmentId: null });
  });

  it('counts for a guest only the prints and the files shown in the description', () => {
    expect(TaskAttachmentSummaryPolicy.summarize([pdf, commentImage, image, print], '', true)).toEqual({ attachmentCount: 1, coverAttachmentId: 'a4' });
    expect(TaskAttachmentSummaryPolicy.summarize([pdf, commentImage, image, print], 'ver [doc](/attachments/a1/content)', true)).toEqual({ attachmentCount: 2, coverAttachmentId: 'a4' });
  });

  it('gives a guest a hidden image as the cover never, even when it comes first', () => {
    expect(TaskAttachmentSummaryPolicy.summarize([image, pdf], '', true)).toEqual({ attachmentCount: 0, coverAttachmentId: null });
    expect(TaskAttachmentSummaryPolicy.summarize([image, pdf], '![x](/attachments/a3/content)', true)).toEqual({ attachmentCount: 1, coverAttachmentId: 'a3' });
  });
});
