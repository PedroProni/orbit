import { PullRequestLinkEntity } from './pull-request-link.entity';
import { PullRequestLinkSource, PullRequestState } from '@domain/enums/pull-request-link.enums';
import { GithubChecksState } from '@domain/enums/github.enums';
import { GithubPullRequest } from '@domain/types/github-pull-request.type';

const pr = (updatedAt: string, state = PullRequestState.OPEN): GithubPullRequest => ({
  repository: 'PedroProni/orbit-api',
  number: 1,
  title: `T ${updatedAt}`,
  body: '',
  url: 'https://github.com/PedroProni/orbit-api/pull/1',
  state,
  draft: false,
  authorLogin: 'dev',
  authorAvatarUrl: null,
  headRef: 'feat/x',
  headSha: 'abc1234',
  updatedAt: new Date(updatedAt),
});

describe('PullRequestLinkEntity', () => {
  it('starts empty from a seed and takes GitHub data and checks', () => {
    const link = PullRequestLinkEntity.fromSeed({
      _id: 'p1',
      workspaceId: 'w1',
      taskId: 't1',
      repository: 'PedroProni/orbit-api',
      number: 1,
      url: 'u',
      source: PullRequestLinkSource.SYNC,
      createdBy: null,
      now: new Date(0),
    });
    expect([link.getTitle(), link.getState(), link.getChecksState(), link.getSyncedAt()]).toEqual(['', null, null, null]);
    expect(link.applyGithub(pr('2026-11-02T00:00:00Z'), GithubChecksState.FAILURE, new Date(5))).toContain('checksState');
    expect([link.getState(), link.getChecksState(), link.getHeadSha(), link.getSyncedAt()]).toEqual([PullRequestState.OPEN, GithubChecksState.FAILURE, 'abc1234', new Date(5)]);
  });

  it('ignores an older GitHub snapshot so a late writer never rolls the link back, and keeps checks when none are given', () => {
    const link = PullRequestLinkEntity.fromSeed({
      _id: 'p1',
      workspaceId: 'w1',
      taskId: 't1',
      repository: 'PedroProni/orbit-api',
      number: 1,
      url: 'u',
      source: PullRequestLinkSource.SYNC,
      createdBy: null,
      now: new Date(0),
    });
    link.applyGithub(pr('2026-11-02T00:00:00Z', PullRequestState.MERGED), GithubChecksState.SUCCESS, new Date(5));
    expect(link.applyGithub(pr('2026-11-01T00:00:00Z'), GithubChecksState.FAILURE, new Date(6))).toEqual([]);
    expect([link.getState(), link.getChecksState()]).toEqual([PullRequestState.MERGED, GithubChecksState.SUCCESS]);
    link.applyGithub(pr('2026-11-03T00:00:00Z', PullRequestState.MERGED), null, new Date(7));
    expect(link.getChecksState()).toBe(GithubChecksState.SUCCESS);
    expect(link.applyChecks(GithubChecksState.PENDING, new Date(8))).toEqual(['checksState', 'syncedAt']);
  });
});
