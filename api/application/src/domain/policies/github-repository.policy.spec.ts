import { GithubRepositoryPolicy } from './github-repository.policy';

describe('GithubRepositoryPolicy', () => {
  it('uses the default list only when the setting is absent, and an empty value disables the sync', () => {
    expect(GithubRepositoryPolicy.parseList(undefined)).toEqual(['PedroProni/orbit-api', 'PedroProni/orbit-frontend', 'PedroProni/orbit']);
    expect(GithubRepositoryPolicy.parseList('')).toEqual([]);
  });

  it('keeps valid owner/name entries once, case-insensitively, and drops anything else', () => {
    expect(GithubRepositoryPolicy.parseList(' a/b ,A/B,../x,c/d/e,https://github.com/a/b,owner/name.js')).toEqual(['a/b', 'owner/name.js']);
  });

  it('matches listed repositories regardless of case', () => {
    expect(GithubRepositoryPolicy.isListed(['PedroProni/orbit-api'], 'pedroproni/ORBIT-api')).toBe(true);
    expect(GithubRepositoryPolicy.isListed(['PedroProni/orbit-api'], 'PedroProni/secret')).toBe(false);
    expect(GithubRepositoryPolicy.key('PedroProni/Orbit')).toBe('pedroproni/orbit');
  });
});
