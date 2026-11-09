import { Inject, Injectable } from '@nestjs/common';
import { ATTACHMENT_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { AttachmentRepository } from '@domain/repositories/attachment.repository';
import { AttachmentGallery } from '@domain/enums/attachment.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { TaskAccessService } from '@application/services/task-access.service';
import { AttachmentPresenter } from '@application/presenters/attachment.presenter';

@Injectable()
export class ListTaskPrintsUseCase {
  constructor(
    @Inject(ATTACHMENT_INJECT_TOKEN) private readonly attachments: AttachmentRepository,
    private readonly access: TaskAccessService,
  ) {}

  async execute(principal: AuthPrincipal, taskId: string) {
    const task = await this.access.readable(principal, taskId);
    const items = await this.attachments.findMany({ workspace_id: principal.workspaceId, task_id: task.getId(), confirmed: true, gallery: AttachmentGallery.PRINTS }, { created_at: 1 }, 200);
    return items.map(item => AttachmentPresenter.toView(item));
  }
}
