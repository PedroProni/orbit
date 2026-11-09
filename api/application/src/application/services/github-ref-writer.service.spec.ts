import { GithubRefWriterService } from './github-ref-writer.service';
import { PullRequestLinkWriterService } from './pull-request-link-writer.service';
import { GithubRefEntity } from '@domain/entities/github-ref.entity';
import { GithubRefKind } from '@domain/enums/github.enums';

const setup = () => {
  const refs = { upsertRef: jest.fn().mockResolvedValue(undefined), removeBranch: jest.fn().mockResolvedValue(1), removeBranchesNotIn: jest.fn().mockResolvedValue(2) };
  const env = { getGithubRepositories: () => ['PedroProni/orbit-api'] };
  const writer = new GithubRefWriterService(refs as never, new PullRequestLinkWriterService({} as never, env as never));
  const task = { getWorkspaceId: () => 'w1', getId: () => '86abc1234' };
  return { refs, writer, task };
};

describe('GithubRefWriterService', () => {
  it('records a ref for the task in the workspace with the listed repository casing', async () => {
    const { refs, writer, task } = setup();
    const now = new Date('2026-11-09T10:00:00Z');
    await writer.record(
      task as never,
      {
        repository: 'pedroproni/ORBIT-API',
        kind: GithubRefKind.BRANCH,
        key: 'feat/86abc1234',
        title: '',
        url: 'https://github.com/PedroProni/orbit-api/tree/feat/86abc1234',
        authorLogin: 'octo',
        occurredAt: null,
      },
      now,
    );
    const saved = (refs.upsertRef.mock.calls as GithubRefEntity[][])[0][0];
    expect(saved.getRepository()).toBe('PedroProni/orbit-api');
    expect(saved.getWorkspaceId()).toBe('w1');
    expect(saved.getTaskId()).toBe('86abc1234');
    expect(saved.getKind()).toBe(GithubRefKind.BRANCH);
    expect(saved.getKey()).toBe('feat/86abc1234');
    expect(saved.getAuthorLogin()).toBe('octo');
  });

  it('removes branches under the canonical repository name and passes the round start through', async () => {
    const { refs, writer } = setup();
    const seenBefore = new Date('2026-11-09T09:00:00Z');
    await expect(writer.removeBranch('PEDROPRONI/orbit-api', 'feat/x')).resolves.toBe(1);
    expect(refs.removeBranch).toHaveBeenCalledWith('PedroProni/orbit-api', 'feat/x');
    await expect(writer.removeBranchesNotIn('pedroproni/orbit-api', ['main'], seenBefore)).resolves.toBe(2);
    expect(refs.removeBranchesNotIn).toHaveBeenCalledWith('PedroProni/orbit-api', ['main'], seenBefore);
  });
});
