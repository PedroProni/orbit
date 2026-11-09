import { GithubChecksState } from '@domain/enums/github.enums';

export const GITHUB_FAILED_CONCLUSIONS = ['failure', 'timed_out', 'cancelled', 'action_required', 'startup_failure', 'stale'];
export const GITHUB_FAILED_STATUS_STATES = ['failure', 'error'];
export const GITHUB_CHECKS_PRIORITY = [GithubChecksState.FAILURE, GithubChecksState.PENDING, GithubChecksState.SUCCESS, GithubChecksState.NONE];
