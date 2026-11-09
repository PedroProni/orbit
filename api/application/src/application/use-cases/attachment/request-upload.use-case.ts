import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ATTACHMENT_INJECT_TOKEN, COMMENT_INJECT_TOKEN, TASK_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { AttachmentRepository } from '@domain/repositories/attachment.repository';
import { CommentRepository } from '@domain/repositories/comment.repository';
import { TaskRepository } from '@domain/repositories/task.repository';
import { AttachmentEntity } from '@domain/entities/attachment.entity';
import { AttachmentGallery } from '@domain/enums/attachment.enums';
import { AttachmentGalleryPolicy } from '@domain/policies/attachment-gallery.policy';
import { ObjectStorage } from '@domain/types/object-storage.type';
import { OBJECT_STORAGE_TOKEN } from '@domain/constants/object-storage.constant';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { EnvConfigService } from '@common/env/services/env-config.service';
import { newId } from '@common/helpers/functions/id.helper';
import { AuditService } from '@application/services/audit.service';
import { AttachmentPresenter } from '@application/presenters/attachment.presenter';

@Injectable()
export class RequestUploadUseCase {
  constructor(
    @Inject(ATTACHMENT_INJECT_TOKEN) private readonly attachments: AttachmentRepository,
    @Inject(TASK_INJECT_TOKEN) private readonly tasks: TaskRepository,
    @Inject(COMMENT_INJECT_TOKEN) private readonly comments: CommentRepository,
    @Inject(OBJECT_STORAGE_TOKEN) private readonly storage: ObjectStorage,
    private readonly env: EnvConfigService,
    private readonly audit: AuditService,
  ) {}

  async execute(principal: AuthPrincipal, taskId: string, input: { filename: string; mimeType: string; sizeBytes: number; commentId?: string; gallery?: AttachmentGallery }) {
    const task = await this.tasks.findByIdInWorkspace(taskId, principal.workspaceId);
    if (!task) throw new NotFoundException('Task not found');
    const gallery = input.gallery ?? null;
    if (!AttachmentGalleryPolicy.accepts(gallery, input.mimeType, input.commentId ?? null)) throw new BadRequestException('Prints must be images attached to the task');
    if (input.commentId) {
      const comment = await this.comments.findByIdInWorkspace(input.commentId, principal.workspaceId);
      if (!comment || comment.getTaskId() !== taskId) throw new NotFoundException('Comment not found');
    }
    const id = newId();
    const safeName = input.filename
      .replace(/[^A-Za-z0-9._-]/g, '_')
      .replace(/\.{2,}/g, '_')
      .slice(0, 120);
    const key = `${principal.workspaceId}/${taskId}/${id}-${safeName}`;
    const now = new Date();
    const saved = await this.attachments.create(
      new AttachmentEntity({
        _id: id,
        workspaceId: principal.workspaceId,
        taskId,
        commentId: input.commentId ?? null,
        storageKey: key,
        filename: input.filename,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        uploaderId: principal.userId,
        confirmed: false,
        gallery,
        createdAt: now,
        updatedAt: now,
      }),
    );
    const uploadUrl = await this.storage.presignUpload(key, input.mimeType, this.env.getPresignTtlSeconds());
    await this.audit.record(principal, 'attachment.requested', 'attachment', id, { taskId, filename: input.filename, gallery });
    return { ...AttachmentPresenter.toView(saved), uploadUrl };
  }
}
