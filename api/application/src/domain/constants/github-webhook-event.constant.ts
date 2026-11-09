export const GITHUB_TRANSITION_ACTIONS = ['opened', 'reopened', 'ready_for_review', 'closed'] as const;
export const GITHUB_DATA_ACTIONS = ['edited', 'synchronize', 'converted_to_draft'] as const;
export const GITHUB_BRANCH_REF_PREFIX = 'refs/heads/';
export const GITHUB_EVENT = {
  PULL_REQUEST: 'pull_request',
  PUSH: 'push',
  CREATE: 'create',
  DELETE: 'delete',
  CHECK_SUITE: 'check_suite',
  CHECK_RUN: 'check_run',
  STATUS: 'status',
} as const;
