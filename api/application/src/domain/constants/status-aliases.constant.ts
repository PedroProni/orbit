export const LEGACY_STATUS_ALIASES: Readonly<Record<string, string>> = {
  backlog: 'backlog',
  'to-do': 'to-do',
  'to do': 'to-do',
  open: 'to-do',
  stuck: 'stuck',
  'in development': 'in development',
  'in progress': 'in development',
  'waiting review': 'waiting review',
  'in review': 'in review',
  testing: 'in review',
  completed: 'completed',
  done: 'completed',
  'ready for deploy': 'completed',
  deployed: 'completed',
  complete: 'completed',
  closed: 'completed',
  cancelled: 'completed',
};

export const CANCELLED_LEGACY_STATUSES: readonly string[] = ['cancelled'];

export const CANCELLED_TAG = 'cancelado';

export const BLOCKED_TAG = 'bloqueado';

export const BLOCKED_LEGACY_STATUS = 'in progress';

export const BLOCKED_TARGET_STATUS = 'stuck';
