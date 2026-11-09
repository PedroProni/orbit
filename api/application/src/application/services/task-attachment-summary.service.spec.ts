import { TaskAttachmentSummaryService } from '@application/services/task-attachment-summary.service';
import { GuestAccessService } from '@application/services/guest-access.service';
import { AttachmentRepository } from '@domain/repositories/attachment.repository';
import { TaskEntity } from '@domain/entities/task.entity';
import { AttachmentGallery } from '@domain/enums/attachment.enums';
import { AuditActorType } from '@domain/enums/audit-log.enums';
import { UserRole } from '@domain/enums/user.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';

describe('TaskAttachmentSummaryService', () => {
  const principal: AuthPrincipal = { workspaceId: 'w1', actorType: AuditActorType.USER, actorId: 'u1', userId: 'u1', role: UserRole.MEMBER, scopes: [] };
  const task = (id: string, descriptionMd = '') => ({ getId: () => id, getDescriptionMd: () => descriptionMd }) as unknown as TaskEntity;
  const items = new Map([
    [
      't1',
      [
        { id: 'a1', mimeType: 'image/png', commentId: null, gallery: null },
        { id: 'a2', mimeType: 'image/png', commentId: null, gallery: AttachmentGallery.PRINTS },
      ],
    ],
  ]);
  const build = (allowed: string[] | null) => {
    const attachments = { confirmedItemsByTask: jest.fn().mockResolvedValue(items) };
    const guests = { allowedListIds: jest.fn().mockResolvedValue(allowed) };
    return { attachments, service: new TaskAttachmentSummaryService(attachments as unknown as AttachmentRepository, guests as unknown as GuestAccessService) };
  };

  it('reads the files of the whole page in one call and gives tasks without files an empty summary', async () => {
    const { attachments, service } = build(null);
    const result = await service.forTasks(principal, [task('t1'), task('t2')]);
    expect(attachments.confirmedItemsByTask).toHaveBeenCalledTimes(1);
    expect(attachments.confirmedItemsByTask).toHaveBeenCalledWith('w1', ['t1', 't2']);
    expect(result.get('t1')).toEqual({ attachmentCount: 2, coverAttachmentId: 'a1' });
    expect(result.get('t2')).toEqual({ attachmentCount: 0, coverAttachmentId: null });
  });

  it('applies the guest rules when the user is a guest', async () => {
    const { service } = build(['l1']);
    const result = await service.forTasks({ ...principal, role: UserRole.GUEST }, [task('t1')]);
    expect(result.get('t1')).toEqual({ attachmentCount: 1, coverAttachmentId: 'a2' });
  });

  it('does not query when the page is empty', async () => {
    const { attachments, service } = build(null);
    await expect(service.forTasks(principal, [])).resolves.toEqual(new Map());
    expect(attachments.confirmedItemsByTask).not.toHaveBeenCalled();
  });
});
