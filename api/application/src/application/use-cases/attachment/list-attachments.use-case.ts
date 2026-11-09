import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ATTACHMENT_INJECT_TOKEN, TASK_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { AttachmentRepository } from '@domain/repositories/attachment.repository';
import { TaskRepository } from '@domain/repositories/task.repository';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { AttachmentPresenter } from '@application/presenters/attachment.presenter';

@Injectable()
export class ListAttachmentsUseCase {
  constructor(
    @Inject(ATTACHMENT_INJECT_TOKEN) private readonly attachments: AttachmentRepository,
    @Inject(TASK_INJECT_TOKEN) private readonly tasks: TaskRepository,
  ) {}

  async execute(principal: AuthPrincipal, taskId: string) {
    if (!(await this.tasks.findByIdInWorkspace(taskId, principal.workspaceId))) throw new NotFoundException('Task not found');
    const items = await this.attachments.findMany({ workspace_id: principal.workspaceId, task_id: taskId, confirmed: true }, { created_at: 1 });
    return items.map(AttachmentPresenter.toView);
  }
}
