import { GithubRefPolicy } from './github-ref.policy';
import { GithubRefKind } from '@domain/enums/github.enums';

describe('GithubRefPolicy', () => {
  it('builds a branch ref with an encoded tree url', () => {
    expect(GithubRefPolicy.branch('PedroProni/orbit-api', { name: 'feat/86abc1234 #1' })).toEqual({
      repository: 'PedroProni/orbit-api',
      kind: GithubRefKind.BRANCH,
      key: 'feat/86abc1234 #1',
      title: 'feat/86abc1234 #1',
      url: 'https://github.com/PedroProni/orbit-api/tree/feat/86abc1234%20%231',
      authorLogin: null,
      occurredAt: null,
    });
  });

  it('builds a commit ref with the first line of the message, cut at 200 characters, and a github.com url', () => {
    const ref = GithubRefPolicy.commit('PedroProni/orbit-api', { sha: 'ABC1234', message: `${'x'.repeat(250)}\n\ncorpo`, url: 'https://evil.example/c', authorLogin: 'dev', committedAt: new Date(0) });
    expect(ref.key).toBe('abc1234');
    expect(ref.title).toHaveLength(200);
    expect(ref.url).toBe('https://github.com/PedroProni/orbit-api/commit/abc1234');
    expect(ref.authorLogin).toBe('dev');
  });
});
