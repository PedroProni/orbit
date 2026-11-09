import { TaskCreationPolicy } from '@domain/policies/task-creation.policy';

describe('TaskCreationPolicy prefix edge cases', () => {
  it.each([
    ['trims leading whitespace', '  [P4T] work', true],
    ['accepts a bare prefix tag', '[P4T]', true],
    ['accepts a space separated suffix', '[P4T COL] work', true],
    ['accepts a dot separated suffix', '[P4T.PK] work', true],
    ['rejects a dash separated suffix', '[P4T-COL] work', false],
    ['rejects an unclosed bracket', '[P4T work', false],
    ['rejects the prefix in the middle of the title', 'work [P4T]', false],
    ['rejects an empty title', '', false],
    ['rejects a blank title', '   ', false],
  ])('%s', (_name, title, expected) => {
    expect(TaskCreationPolicy.hasAllowedPrefix(title, ['P4T'])).toBe(expected);
  });

  it('accepts any of several prefixes', () => {
    expect(TaskCreationPolicy.hasAllowedPrefix('[SG] x', ['P4T', 'SG'])).toBe(true);
    expect(TaskCreationPolicy.hasAllowedPrefix('[MTB] x', ['P4T', 'SG'])).toBe(false);
  });

  it('matches lowercase configured prefixes', () => {
    expect(TaskCreationPolicy.hasAllowedPrefix('[P4T] x', ['p4t'])).toBe(true);
  });

  it('escapes dots and brackets in prefixes', () => {
    expect(TaskCreationPolicy.hasAllowedPrefix('[AXB] x', ['A.B'])).toBe(false);
    expect(TaskCreationPolicy.hasAllowedPrefix('[A.B] x', ['A.B'])).toBe(true);
    expect(TaskCreationPolicy.hasAllowedPrefix('[[x] y', ['[x'])).toBe(true);
  });
});

describe('TaskCreationPolicy tag edge cases', () => {
  it('fails when tags are empty but a tag is required', () => {
    expect(TaskCreationPolicy.hasRequiredTag([], ['bug'])).toBe(false);
  });

  it('passes when any one required tag is present', () => {
    expect(TaskCreationPolicy.hasRequiredTag(['x', 'feat'], ['bug', 'feat'])).toBe(true);
  });

  it('normalizes case and whitespace of task tags', () => {
    expect(TaskCreationPolicy.hasRequiredTag(['  FEAT  '], ['feat'])).toBe(true);
  });

  it('does not match partial tag names', () => {
    expect(TaskCreationPolicy.hasRequiredTag(['bugfix'], ['bug'])).toBe(false);
  });

  it('ignores tags when none are required', () => {
    expect(TaskCreationPolicy.hasRequiredTag(['anything'], [])).toBe(true);
  });

  it('matches required tags regardless of their casing', () => {
    expect(TaskCreationPolicy.hasRequiredTag(['bug'], ['Bug'])).toBe(true);
  });
});
