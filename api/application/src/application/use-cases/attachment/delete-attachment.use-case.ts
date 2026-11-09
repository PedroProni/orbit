import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ATTACHMENT_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { AttachmentRepository } from '@domain/repositories/attachment.repository';
import { ObjectStorage } from '@domain/types/object-storage.type';
import { OBJECT_STORAGE_TOKEN } from '@domain/constants/object-storage.constant';
import { CommentAccessPolicy } from '@domain/policies/comment-access.policy';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { AuditService } from '@application/services/audit.service';

@Injectable()
export class DeleteAttachmentUseCase {
  constructor(
    @Inject(ATTACHMENT_INJECT_TOKEN) private readonly attachments: AttachmentRepository,
    @Inject(OBJECT_STORAGE_TOKEN) private readonly storage: ObjectStorage,
    private readonly audit: AuditService,
  ) {}

  async execute(principal: AuthPrincipal, attachmentId: string): Promise<void> {
    const attachment = await this.attachments.findByIdInWorkspace(attachmentId, principal.workspaceId);
    if (!attachment) throw new NotFoundException('Attachment not found');
    if (!CommentAccessPolicy.canDelete(principal, attachment.getUploaderId())) throw new ForbiddenException('Not allowed to delete this attachment');
    await this.storage.remove(attachment.getStorageKey());
    await this.attachments.delete(attachmentId);
    await this.audit.record(principal, 'attachment.deleted', 'attachment', attachmentId, { taskId: attachment.getTaskId() });
  }
}
