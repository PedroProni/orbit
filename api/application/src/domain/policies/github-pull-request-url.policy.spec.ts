import { GithubPullRequestUrlPolicy } from './github-pull-request-url.policy';

describe('GithubPullRequestUrlPolicy', () => {
  it('lê o repositório e o número de links de PR do GitHub e normaliza a URL', () => {
    expect(GithubPullRequestUrlPolicy.parse(' https://github.com/acme-org/orbit/pull/42 ')).toEqual({
      repository: 'acme-org/orbit',
      number: 42,
      url: 'https://github.com/acme-org/orbit/pull/42',
    });
    expect(GithubPullRequestUrlPolicy.parse('https://www.github.com/acme/web.app/pull/7/files?diff=split#r1')).toEqual({
      repository: 'acme/web.app',
      number: 7,
      url: 'https://github.com/acme/web.app/pull/7',
    });
    expect(GithubPullRequestUrlPolicy.parse('https://github.com/acme/api/pull/3/')?.number).toBe(3);
  });

  it('recusa o que não é link de PR do GitHub', () => {
    for (const bad of [
      'http://github.com/a/b/pull/1',
      'https://github.com.evil.test/a/b/pull/1',
      'https://evil.test/github.com/a/b/pull/1',
      'https://github.com/a/b/issues/1',
      'https://github.com/a/b/pull/0',
      'https://github.com/a/b/pull/1x',
      'https://github.com/a/../pull/1',
      'https://github.com/-a/b/pull/1',
      'https://github.com/a-/b/pull/1',
      'javascript:alert(1)',
      'https://github.com/a/b/pull/1 extra',
      `https://github.com/a/b/pull/1?${'x'.repeat(600)}`,
    ]) {
      expect(GithubPullRequestUrlPolicy.parse(bad)).toBeNull();
    }
  });

  it('monta o rótulo repo#número', () => {
    expect(GithubPullRequestUrlPolicy.label('acme/api', 9)).toBe('acme/api#9');
  });
});
