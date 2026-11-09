import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ATTACHMENT_INJECT_TOKEN, TASK_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { AttachmentRepository } from '@domain/repositories/attachment.repository';
import { TaskRepository } from '@domain/repositories/task.repository';
import { AttachmentEntity } from '@domain/entities/attachment.entity';
import { ObjectStorage } from '@domain/types/object-storage.type';
import { OBJECT_STORAGE_TOKEN } from '@domain/constants/object-storage.constant';
import { ATTACHMENT_MAX_BYTES } from '@domain/constants/attachment.constant';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { newId } from '@common/helpers/functions/id.helper';
import { AuditService } from '@application/services/audit.service';

@Injectable()
export class ClickupAttachmentUseCase {
  constructor(
    @Inject(ATTACHMENT_INJECT_TOKEN) private readonly attachments: AttachmentRepository,
    @Inject(TASK_INJECT_TOKEN) private readonly tasks: TaskRepository,
    @Inject(OBJECT_STORAGE_TOKEN) private readonly storage: ObjectStorage,
    private readonly audit: AuditService,
  ) {}

  async execute(principal: AuthPrincipal, taskId: string, file: { originalname: string; mimetype: string; buffer: Buffer } | undefined) {
    if (!file || file.buffer.length === 0) throw new BadRequestException('attachment file is required');
    if (file.buffer.length > ATTACHMENT_MAX_BYTES) throw new BadRequestException('File too large');
    if (!(await this.tasks.findByIdInWorkspace(taskId, principal.workspaceId))) throw new NotFoundException('Task not found');
    const id = newId();
    const safeName = file.originalname
      .replace(/[^A-Za-z0-9._-]/g, '_')
      .replace(/\.{2,}/g, '_')
      .slice(0, 120);
    const key = `${principal.workspaceId}/${taskId}/${id}-${safeName}`;
    await this.storage.put(key, file.buffer, file.mimetype);
    const now = new Date();
    await this.attachments.create(
      new AttachmentEntity({
        _id: id,
        workspaceId: principal.workspaceId,
        taskId,
        commentId: null,
        storageKey: key,
        filename: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.buffer.length,
        uploaderId: principal.userId,
        confirmed: true,
        gallery: null,
        createdAt: now,
        updatedAt: now,
      }),
    );
    await this.audit.record(principal, 'attachment.created', 'attachment', id, { taskId, filename: file.originalname });
    return {
      id,
      version: 0,
      date: now.getTime(),
      title: file.originalname,
      extension: file.originalname.split('.').pop() ?? '',
      thumbnail_small: null,
      thumbnail_large: null,
      url: `/attachments/${id}/download`,
    };
  }
}
