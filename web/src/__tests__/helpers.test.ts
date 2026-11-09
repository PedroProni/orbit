import { describe, expect, it } from 'vitest';
import { toQuery } from '@/lib/api-client';
import { customFieldChanges, groupByStatus } from '@/components/tasks/task-helpers';
import { CustomFieldDefinition, Task } from '@/types/api.types';

describe('toQuery', () => {
  it('drops empty values and joins arrays', () => {
    expect(toQuery({ a: 'x', b: '', c: [], d: ['1', '2'], e: false })).toBe('?a=x&d=1%2C2&e=false');
  });

  it('returns empty text without params', () => {
    expect(toQuery({})).toBe('');
  });
});

describe('groupByStatus', () => {
  it('keeps every status key and groups tasks', () => {
    const groups = groupByStatus([{ id: '1', status: 'a' }, { id: '2', status: 'a' }] as Task[], ['a', 'b']);
    expect(groups.a).toHaveLength(2);
    expect(groups.b).toEqual([]);
  });
});

describe('customFieldChanges', () => {
  const definitions: CustomFieldDefinition[] = [
    { id: 'f1', spaceId: 's1', name: 'Ambiente', type: 'dropdown', options: [{ id: 'o1', label: 'Homolog', color: '#000' }, { id: 'o2', label: 'Prod', color: '#111' }] },
    { id: 'f3', spaceId: 's1', name: 'Entrega', type: 'date', options: [] },
  ];

  it('lists only the fields whose value changed, with option labels and formatted dates', () => {
    const changes = customFieldChanges([{ fieldId: 'f1', value: 'o1' }, { fieldId: 'f3', value: null }], [{ fieldId: 'f1', value: 'o2' }, { fieldId: 'f3', value: '2026-12-01T12:00:00.000Z' }], definitions, 'en-US');
    expect(changes).toEqual([
      { fieldId: 'f1', name: 'Ambiente', before: 'Homolog', after: 'Prod' },
      { fieldId: 'f3', name: 'Entrega', before: '-', after: '12/01/2026' },
    ]);
  });

  it('reports a removed value and ignores malformed entries', () => {
    expect(customFieldChanges([{ fieldId: 'f1', value: 'o1' }, 'x', null], [{ fieldId: 'f1', value: null }, { value: 'o2' }], definitions, 'en-US')).toEqual([{ fieldId: 'f1', name: 'Ambiente', before: 'Homolog', after: '-' }]);
    expect(customFieldChanges(null, undefined, definitions, 'en-US')).toEqual([]);
  });
});
