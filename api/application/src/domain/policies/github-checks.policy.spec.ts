import { GithubChecksPolicy } from './github-checks.policy';
import { GithubChecksState } from '@domain/enums/github.enums';

describe('GithubChecksPolicy', () => {
  it('answers none without runs or statuses', () => {
    expect(GithubChecksPolicy.summarize([], null)).toBe(GithubChecksState.NONE);
    expect(GithubChecksPolicy.summarize([], { state: 'pending', totalCount: 0 })).toBe(GithubChecksState.NONE);
  });

  it('keeps the worst result between check runs and commit statuses', () => {
    const passed = [{ status: 'completed', conclusion: 'success' }];
    expect(GithubChecksPolicy.summarize(passed, null)).toBe(GithubChecksState.SUCCESS);
    expect(GithubChecksPolicy.summarize([...passed, { status: 'in_progress', conclusion: null }], null)).toBe(GithubChecksState.PENDING);
    expect(GithubChecksPolicy.summarize([...passed, { status: 'completed', conclusion: 'timed_out' }], { state: 'pending', totalCount: 1 })).toBe(GithubChecksState.FAILURE);
    expect(GithubChecksPolicy.summarize(passed, { state: 'error', totalCount: 1 })).toBe(GithubChecksState.FAILURE);
    expect(GithubChecksPolicy.summarize(passed, { state: 'pending', totalCount: 2 })).toBe(GithubChecksState.PENDING);
    expect(GithubChecksPolicy.summarize([{ status: 'completed', conclusion: 'skipped' }], { state: 'success', totalCount: 1 })).toBe(GithubChecksState.SUCCESS);
  });
});
