import { NotFoundException } from '@nestjs/common';
import { AttachmentContentUseCase } from './attachment-content.use-case';
import { UserRole } from '@domain/enums/user.enums';
import { AuditActorType } from '@domain/enums/audit-log.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { ATTACHMENT_DOWNLOAD_TTL_SECONDS } from '@domain/constants/attachment.constant';

const principal = (role: UserRole): AuthPrincipal => ({ workspaceId: 'w1', actorType: AuditActorType.USER, actorId: 'u1', userId: 'u1', role, scopes: [], sessionId: 's1' });

const attachment = (confirmed = true) => ({ getConfirmed: () => confirmed, getTaskId: () => 't1', getStorageKey: () => 'w1/t1/a1', getFilename: () => 'print.png' });

const task = (descriptionMd: string, listId = 'l1') => ({ getId: () => 't1', getWorkspaceId: () => 'w1', getListId: () => listId, getDescriptionMd: () => descriptionMd });

const build = (allowed: string[] | null = null, taskFound: unknown = task(''), found: unknown = attachment()) => {
  const attachments = { findByIdInWorkspace: jest.fn().mockResolvedValue(found) };
  const tasks = { findByIdInWorkspace: jest.fn().mockResolvedValue(taskFound) };
  const storage = { presignDownload: jest.fn().mockResolvedValue('https://signed/url') };
  const guests = { allowedListIds: jest.fn().mockResolvedValue(allowed) };
  const useCase = new AttachmentContentUseCase(attachments as never, tasks as never, storage as never, guests as never);
  return { useCase, attachments, tasks, storage };
};

describe('AttachmentContentUseCase', () => {
  it('redirects a member to a short signed link, looking the file up only in their workspace', async () => {
    const { useCase, attachments, tasks, storage } = build();
    await expect(useCase.execute(principal(UserRole.MEMBER), 'a1')).resolves.toEqual({ url: 'https://signed/url', statusCode: 302 });
    expect(attachments.findByIdInWorkspace).toHaveBeenCalledWith('a1', 'w1');
    expect(storage.presignDownload).toHaveBeenCalledWith('w1/t1/a1', 'print.png', ATTACHMENT_DOWNLOAD_TTL_SECONDS);
    expect(tasks.findByIdInWorkspace).not.toHaveBeenCalled();
  });

  it('answers not found for a missing or unconfirmed file, without signing anything', async () => {
    for (const found of [null, attachment(false)]) {
      const { useCase, storage } = build(null, task(''), found);
      await expect(useCase.execute(principal(UserRole.OWNER), 'a1')).rejects.toBeInstanceOf(NotFoundException);
      expect(storage.presignDownload).not.toHaveBeenCalled();
    }
  });

  it('lets a guest open a file shown in the description of a task in a shared list', async () => {
    const { useCase, tasks } = build(['l1'], task('antes ![p](/attachments/a1/content) depois'));
    await expect(useCase.execute(principal(UserRole.GUEST), 'a1')).resolves.toEqual({ url: 'https://signed/url', statusCode: 302 });
    expect(tasks.findByIdInWorkspace).toHaveBeenCalledWith('t1', 'w1');
  });

  it('refuses a guest a file the description does not show, a similar id, a task outside the shared lists, or a missing task', async () => {
    const cases: [string[], unknown][] = [
      [['l1'], task('outro ![p](/attachments/a2/content)')],
      [['l1'], task('![p](/attachments/a10/content) /attachments/a1 a1')],
      [['l2'], task('![p](/attachments/a1/content)')],
      [[], task('![p](/attachments/a1/content)')],
      [['l1'], null],
    ];
    for (const [allowed, taskFound] of cases) {
      const { useCase, storage } = build(allowed, taskFound);
      await expect(useCase.execute(principal(UserRole.GUEST), 'a1')).rejects.toBeInstanceOf(NotFoundException);
      expect(storage.presignDownload).not.toHaveBeenCalled();
    }
  });
});
