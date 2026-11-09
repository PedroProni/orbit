import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ATTACHMENT_INJECT_TOKEN, COMMENT_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { AttachmentRepository } from '@domain/repositories/attachment.repository';
import { CommentRepository } from '@domain/repositories/comment.repository';
import { ObjectStorage } from '@domain/types/object-storage.type';
import { OBJECT_STORAGE_TOKEN } from '@domain/constants/object-storage.constant';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { AuditService } from '@application/services/audit.service';
import { AttachmentPresenter } from '@application/presenters/attachment.presenter';

@Injectable()
export class ConfirmAttachmentUseCase {
  constructor(
    @Inject(ATTACHMENT_INJECT_TOKEN) private readonly attachments: AttachmentRepository,
    @Inject(COMMENT_INJECT_TOKEN) private readonly comments: CommentRepository,
    @Inject(OBJECT_STORAGE_TOKEN) private readonly storage: ObjectStorage,
    private readonly audit: AuditService,
  ) {}

  async execute(principal: AuthPrincipal, attachmentId: string) {
    const attachment = await this.attachments.findByIdInWorkspace(attachmentId, principal.workspaceId);
    if (!attachment || attachment.getUploaderId() !== principal.userId) throw new NotFoundException('Attachment not found');
    if (attachment.getConfirmed()) return AttachmentPresenter.toView(attachment);
    const size = await this.storage.headSize(attachment.getStorageKey());
    if (size === null) throw new BadRequestException('Upload not found in storage');
    if (size !== attachment.getSizeBytes()) {
      await this.storage.remove(attachment.getStorageKey());
      await this.attachments.delete(attachmentId);
      throw new BadRequestException('Uploaded size does not match the declared size');
    }
    attachment.confirm();
    const saved = await this.attachments.patch(attachment, ['confirmed']);
    if (saved.getCommentId()) {
      const comment = await this.comments.findByIdInWorkspace(saved.getCommentId()!, principal.workspaceId);
      if (comment) await this.comments.patch(comment.withAttachment(saved.getId()), ['attachmentIds']);
    }
    await this.audit.record(principal, 'attachment.confirmed', 'attachment', attachmentId, { taskId: saved.getTaskId() });
    return AttachmentPresenter.toView(saved);
  }
}
