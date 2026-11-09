import { CustomFieldListScopePolicy } from '@domain/policies/custom-field-list-scope.policy';

describe('CustomFieldListScopePolicy.resolve', () => {
  it('keeps the field space wide when it is attached to every list of the space', () => {
    expect(CustomFieldListScopePolicy.resolve(['b', 'a', 'c'], ['a', 'b', 'c'])).toBeNull();
  });

  it('returns the sorted lists when only some lists carry the field', () => {
    expect(CustomFieldListScopePolicy.resolve(['c', 'a', 'a'], ['a', 'b', 'c'])).toEqual(['a', 'c']);
  });

  it('keeps the field space wide when no list information exists', () => {
    expect(CustomFieldListScopePolicy.resolve([], ['a', 'b'])).toBeNull();
  });

  it('returns the lists when the space has no known lists', () => {
    expect(CustomFieldListScopePolicy.resolve(['x'], [])).toEqual(['x']);
  });
});

describe('CustomFieldListScopePolicy.appliesTo', () => {
  it('applies a space wide field to any list', () => {
    expect(CustomFieldListScopePolicy.appliesTo(null, 'a')).toBe(true);
  });

  it('applies a list scoped field only to its lists', () => {
    expect(CustomFieldListScopePolicy.appliesTo(['a'], 'a')).toBe(true);
    expect(CustomFieldListScopePolicy.appliesTo(['a'], 'b')).toBe(false);
    expect(CustomFieldListScopePolicy.appliesTo(['a'], null)).toBe(false);
  });
});
