import { NotFoundException } from '@nestjs/common';
import { ListTaskPrintsUseCase } from './list-task-prints.use-case';
import { AttachmentEntity } from '@domain/entities/attachment.entity';
import { AttachmentGallery } from '@domain/enums/attachment.enums';
import { AuditActorType } from '@domain/enums/audit-log.enums';
import { UserRole } from '@domain/enums/user.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';

const principal: AuthPrincipal = { workspaceId: 'w1', actorType: AuditActorType.USER, actorId: 'g1', userId: 'g1', role: UserRole.GUEST, scopes: [] };
const print = new AttachmentEntity({
  _id: 'a1',
  workspaceId: 'w1',
  taskId: 't1',
  commentId: null,
  storageKey: 'k',
  filename: 'tela.png',
  mimeType: 'image/png',
  sizeBytes: 10,
  uploaderId: 'u1',
  confirmed: true,
  gallery: AttachmentGallery.PRINTS,
  createdAt: new Date(0),
  updatedAt: new Date(0),
});

describe('ListTaskPrintsUseCase', () => {
  it('lists only confirmed prints of a task the person can read, oldest first', async () => {
    const attachments = { findMany: jest.fn().mockResolvedValue([print]) };
    const access = { readable: jest.fn().mockResolvedValue({ getId: () => 't1' }) };
    const result = await new ListTaskPrintsUseCase(attachments as never, access as never).execute(principal, 't1');
    expect(access.readable).toHaveBeenCalledWith(principal, 't1');
    expect(attachments.findMany).toHaveBeenCalledWith({ workspace_id: 'w1', task_id: 't1', confirmed: true, gallery: AttachmentGallery.PRINTS }, { created_at: 1 }, 200);
    expect(result).toEqual([expect.objectContaining({ id: 'a1', filename: 'tela.png', gallery: 'prints' })]);
  });

  it('stops before reading prints when the task is not readable', async () => {
    const attachments = { findMany: jest.fn() };
    const access = { readable: jest.fn().mockRejectedValue(new NotFoundException()) };
    await expect(new ListTaskPrintsUseCase(attachments as never, access as never).execute(principal, 't9')).rejects.toBeInstanceOf(NotFoundException);
    expect(attachments.findMany).not.toHaveBeenCalled();
  });
});
