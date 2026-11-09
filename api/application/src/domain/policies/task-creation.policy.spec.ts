import { TaskCreationPolicy } from '@domain/policies/task-creation.policy';

describe('TaskCreationPolicy', () => {
  it('accepts any title without prefixes and matches prefixes case-insensitively', () => {
    expect(TaskCreationPolicy.hasAllowedPrefix('anything', [])).toBe(true);
    expect(TaskCreationPolicy.hasAllowedPrefix('[p4t] work', ['P4T'])).toBe(true);
    expect(TaskCreationPolicy.hasAllowedPrefix('[P4T.CO] work', ['P4T'])).toBe(true);
    expect(TaskCreationPolicy.hasAllowedPrefix('P4T work', ['P4T'])).toBe(false);
    expect(TaskCreationPolicy.hasAllowedPrefix('[P4TX] work', ['P4T'])).toBe(false);
  });

  it('escapes regex characters in prefixes', () => {
    expect(TaskCreationPolicy.hasAllowedPrefix('[A+B] x', ['A+B'])).toBe(true);
    expect(TaskCreationPolicy.hasAllowedPrefix('[AAB] x', ['A+B'])).toBe(false);
  });

  it('requires one of the tags when configured', () => {
    expect(TaskCreationPolicy.hasRequiredTag([], [])).toBe(true);
    expect(TaskCreationPolicy.hasRequiredTag([' Bug '], ['bug'])).toBe(true);
    expect(TaskCreationPolicy.hasRequiredTag(['feat'], ['bug'])).toBe(false);
  });
});
