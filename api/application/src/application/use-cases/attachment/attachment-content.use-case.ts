import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ATTACHMENT_INJECT_TOKEN, TASK_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { AttachmentRepository } from '@domain/repositories/attachment.repository';
import { TaskRepository } from '@domain/repositories/task.repository';
import { ObjectStorage } from '@domain/types/object-storage.type';
import { OBJECT_STORAGE_TOKEN } from '@domain/constants/object-storage.constant';
import { ATTACHMENT_DOWNLOAD_TTL_SECONDS } from '@domain/constants/attachment.constant';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { AttachmentContentPolicy } from '@domain/policies/attachment-content.policy';
import { GuestAccessService } from '@application/services/guest-access.service';

@Injectable()
export class AttachmentContentUseCase {
  constructor(
    @Inject(ATTACHMENT_INJECT_TOKEN) private readonly attachments: AttachmentRepository,
    @Inject(TASK_INJECT_TOKEN) private readonly tasks: TaskRepository,
    @Inject(OBJECT_STORAGE_TOKEN) private readonly storage: ObjectStorage,
    private readonly guests: GuestAccessService,
  ) {}

  async execute(principal: AuthPrincipal, attachmentId: string) {
    const attachment = await this.attachments.findByIdInWorkspace(attachmentId, principal.workspaceId);
    if (!attachment || !attachment.getConfirmed()) throw new NotFoundException('Attachment not found');
    const allowed = await this.guests.allowedListIds(principal);
    if (allowed) {
      const task = await this.tasks.findByIdInWorkspace(attachment.getTaskId(), principal.workspaceId);
      if (!task || !allowed.includes(task.getListId()) || !AttachmentContentPolicy.isShownIn(task.getDescriptionMd(), attachmentId)) throw new NotFoundException('Attachment not found');
    }
    const url = await this.storage.presignDownload(attachment.getStorageKey(), attachment.getFilename(), ATTACHMENT_DOWNLOAD_TTL_SECONDS);
    return { url, statusCode: 302 };
  }
}
