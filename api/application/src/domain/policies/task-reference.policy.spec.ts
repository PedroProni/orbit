import { TaskReferencePolicy } from '@domain/policies/task-reference.policy';

describe('TaskReferencePolicy', () => {
  it('returns an empty list without sources', () => {
    expect(TaskReferencePolicy.extract()).toEqual([]);
  });

  it('skips null, undefined and empty sources', () => {
    expect(TaskReferencePolicy.extract(null, undefined, '')).toEqual([]);
  });

  it('extracts an id from a branch name', () => {
    expect(TaskReferencePolicy.extract('feat/86abc1234-add-thing')).toEqual(['86abc1234']);
  });

  it('extracts an id with a hash prefix', () => {
    expect(TaskReferencePolicy.extract('Fixes #86abc1234')).toEqual(['86abc1234']);
  });

  it('lowercases ids', () => {
    expect(TaskReferencePolicy.extract('86ABC1234')).toEqual(['86abc1234']);
  });

  it('deduplicates ids across sources keeping first seen order', () => {
    expect(TaskReferencePolicy.extract('86aaaaaaa and 86bbbbbbb', '86AAAAAAA', 'x 86ccccccc')).toEqual(['86aaaaaaa', '86bbbbbbb', '86ccccccc']);
  });

  it('ignores ids glued to other alphanumerics', () => {
    expect(TaskReferencePolicy.extract('x86abc1234', '86abc12345', '86abc123')).toEqual([]);
  });

  it('ignores text without the 86 prefix', () => {
    expect(TaskReferencePolicy.extract('87abc1234 hello world')).toEqual([]);
  });
});
