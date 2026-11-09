import { Inject, Injectable } from '@nestjs/common';
import { ATTACHMENT_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { EMPTY_TASK_ATTACHMENT_SUMMARY } from '@domain/constants/task-attachment-summary.constant';
import { AttachmentRepository } from '@domain/repositories/attachment.repository';
import { TaskEntity } from '@domain/entities/task.entity';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { TaskAttachmentSummary } from '@domain/types/task-attachment-summary.type';
import { TaskAttachmentSummaryPolicy } from '@domain/policies/task-attachment-summary.policy';
import { GuestAccessService } from '@application/services/guest-access.service';

@Injectable()
export class TaskAttachmentSummaryService {
  constructor(
    @Inject(ATTACHMENT_INJECT_TOKEN) private readonly attachments: AttachmentRepository,
    private readonly guests: GuestAccessService,
  ) {}

  async forTasks(principal: AuthPrincipal, tasks: TaskEntity[]): Promise<Map<string, TaskAttachmentSummary>> {
    if (tasks.length === 0) return new Map();
    const [allowed, items] = await Promise.all([
      this.guests.allowedListIds(principal),
      this.attachments.confirmedItemsByTask(
        principal.workspaceId,
        tasks.map(task => task.getId()),
      ),
    ]);
    const guest = allowed !== null;
    return new Map(
      tasks.map(task => {
        const taskItems = items.get(task.getId());
        const summary = taskItems ? TaskAttachmentSummaryPolicy.summarize(taskItems, task.getDescriptionMd(), guest) : EMPTY_TASK_ATTACHMENT_SUMMARY;
        return [task.getId(), summary];
      }),
    );
  }
}
