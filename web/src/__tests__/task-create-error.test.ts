import { describe, expect, it } from 'vitest';
import { describeCreateError } from '@/components/tasks/task-create-error';
import { ApiError } from '@/lib/api-client';

describe('describeCreateError', () => {
  it('names the prefixes the space asks for', () => {
    expect(describeCreateError(new ApiError(400, 'Title must start with one of: [BUG], [FEAT]'))).toEqual({ key: 'prefixError', values: { prefixes: '[BUG], [FEAT]' } });
  });

  it('names the tags the space asks for', () => {
    expect(describeCreateError(new ApiError(400, 'At least one tag is required: p4t, bko'))).toEqual({ key: 'tagError', values: { tags: 'p4t, bko' } });
  });

  it('explains an unknown status and a refused permission', () => {
    expect(describeCreateError(new ApiError(400, 'Unknown status for this space')).key).toBe('statusError');
    expect(describeCreateError(new ApiError(403, 'Guests cannot use this endpoint')).key).toBe('createForbidden');
  });

  it('falls back to the generic message', () => {
    expect(describeCreateError(new Error('boom')).key).toBe('createFailed');
  });
});
