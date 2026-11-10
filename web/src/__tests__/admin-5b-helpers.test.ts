import { describe, expect, it } from 'vitest';
import { apiTokenProblem, grantableScopes } from '@/components/admin/api-tokens.helpers';
import { API_TOKEN_SCOPES } from '@/components/admin/api-tokens.constants';
import { draftFromForm, draftToInput, emptyFormDraft, emptyFormField, formProblem, publicFormUrl } from '@/components/admin/forms.helpers';
import { draftFromTemplate, draftToTemplateInput, emptyTemplateDraft, parseTemplateTags, templateProblem } from '@/components/admin/templates.helpers';
import { AdminForm } from '@/services/form.types';
import { adminSpace } from './helpers/admin-fixtures';

const FORM: AdminForm = {
  id: 'f1',
  listId: 'l2',
  name: 'Pedidos',
  publicKey: 'a/b c',
  fields: [{ id: 'x1', label: 'Assunto', required: true, target: 'title' }],
  active: false,
  paused: false,
  ownerId: 'u1',
  updatedAt: '2026-11-08T10:00:00.000Z',
};

describe('form helpers', () => {
  it('starts a new form on the first list with one required title field', () => {
    const draft = emptyFormDraft([adminSpace()]);
    expect(draft.listId).toBe('l1');
    expect(draft.fields).toHaveLength(1);
    expect(draft.fields[0]).toMatchObject({ required: true, target: 'title', label: '' });
    expect(draft.fields[0].id).toBeUndefined();
    expect(emptyFormDraft([]).listId).toBe('');
  });

  it('gives each new field its own key', () => {
    expect(emptyFormField('description', false).key).not.toBe(emptyFormField('description', false).key);
  });

  it('round trips a saved form keeping field ids, and sends new fields without one', () => {
    const draft = draftFromForm(FORM);
    draft.fields.push({ ...emptyFormField('description', false), label: '  Telefone ' });
    expect(draftToInput({ ...draft, name: '  Pedidos  ' })).toEqual({
      name: 'Pedidos',
      listId: 'l2',
      active: false,
      fields: [
        { id: 'x1', label: 'Assunto', required: true, target: 'title' },
        { label: 'Telefone', required: false, target: 'description' },
      ],
    });
  });

  it('names the first problem of a draft', () => {
    const ok = draftFromForm(FORM);
    expect(formProblem(ok)).toBeNull();
    expect(formProblem({ ...ok, name: ' ' })).toBe('name');
    expect(formProblem({ ...ok, listId: '' })).toBe('list');
    expect(formProblem({ ...ok, fields: [] })).toBe('fields');
    expect(formProblem({ ...ok, fields: [{ ...ok.fields[0], label: ' ' }] })).toBe('label');
    expect(formProblem({ ...ok, fields: [{ ...ok.fields[0], required: false }] })).toBe('title');
    expect(formProblem({ ...ok, fields: [{ ...ok.fields[0], target: 'description' }] })).toBe('title');
  });

  it('builds the public link with the key encoded', () => {
    expect(publicFormUrl('https://orbit.example', 'a/b c')).toBe('https://orbit.example/f/a%2Fb%20c');
  });
});

describe('template helpers', () => {
  it('keeps unique trimmed tags in order', () => {
    expect(parseTemplateTags(' a, b ,a,, c ')).toEqual(['a', 'b', 'c']);
    expect(parseTemplateTags('')).toEqual([]);
  });

  it('checks space, name, title and estimate', () => {
    const draft = { ...emptyTemplateDraft('s1'), name: 'N', titleTemplate: 'T' };
    expect(templateProblem(draft)).toBeNull();
    expect(templateProblem({ ...draft, spaceId: '' })).toBe('space');
    expect(templateProblem({ ...draft, name: ' ' })).toBe('name');
    expect(templateProblem({ ...draft, titleTemplate: ' ' })).toBe('title');
    for (const estimate of ['1.5', '-1', 'x', '600001']) expect(templateProblem({ ...draft, estimate })).toBe('estimate');
    for (const estimate of ['', '0', '600000']) expect(templateProblem({ ...draft, estimate })).toBeNull();
  });

  it('round trips a template, sending no priority and no estimate as null', () => {
    const template = { id: 't1', spaceId: 's1', name: 'N', titleTemplate: 'T', descriptionMd: 'D', tags: ['a', 'b'], priority: null, taskKind: 'bug' as const, estimateMinutes: null };
    const draft = draftFromTemplate(template);
    expect(draft.tags).toBe('a, b');
    expect(draftToTemplateInput(draft)).toEqual({ spaceId: 's1', name: 'N', titleTemplate: 'T', descriptionMd: 'D', tags: ['a', 'b'], priority: null, taskKind: 'bug', estimateMinutes: null });
  });
});

describe('API token helpers', () => {
  it('offers only the scopes the person holds, in a fixed order', () => {
    expect(grantableScopes(['tasks:write', 'unknown:scope', 'workspace:read'])).toEqual(['workspace:read', 'tasks:write']);
    expect(grantableScopes([])).toEqual([]);
    expect(grantableScopes(API_TOKEN_SCOPES)).toEqual(API_TOKEN_SCOPES);
  });

  it('asks for a name and at least one scope', () => {
    expect(apiTokenProblem(' ', ['tasks:read'])).toBe('name');
    expect(apiTokenProblem('CI', [])).toBe('scopes');
    expect(apiTokenProblem('CI', ['tasks:read'])).toBeNull();
  });
});
