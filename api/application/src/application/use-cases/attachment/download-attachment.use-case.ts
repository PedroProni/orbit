import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ATTACHMENT_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { AttachmentRepository } from '@domain/repositories/attachment.repository';
import { ObjectStorage } from '@domain/types/object-storage.type';
import { OBJECT_STORAGE_TOKEN } from '@domain/constants/object-storage.constant';
import { ATTACHMENT_DOWNLOAD_TTL_SECONDS } from '@domain/constants/attachment.constant';
import { AuthPrincipal } from '@domain/types/auth-principal.type';

@Injectable()
export class DownloadAttachmentUseCase {
  constructor(
    @Inject(ATTACHMENT_INJECT_TOKEN) private readonly attachments: AttachmentRepository,
    @Inject(OBJECT_STORAGE_TOKEN) private readonly storage: ObjectStorage,
  ) {}

  async execute(principal: AuthPrincipal, attachmentId: string) {
    const attachment = await this.attachments.findByIdInWorkspace(attachmentId, principal.workspaceId);
    if (!attachment || !attachment.getConfirmed()) throw new NotFoundException('Attachment not found');
    const url = await this.storage.presignDownload(attachment.getStorageKey(), attachment.getFilename(), ATTACHMENT_DOWNLOAD_TTL_SECONDS);
    return { url, expiresInSeconds: ATTACHMENT_DOWNLOAD_TTL_SECONDS };
  }
}
