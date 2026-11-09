import { CustomFieldType } from '@domain/enums/custom-field.enums';
import { CustomFieldConsolidationPlanner } from './custom-field-consolidation.planner';
import { FieldDefinitionDoc, FieldTaskDoc } from './custom-field-consolidation.type';

const created = new Date('2026-01-01T00:00:00Z');
const def = (id: string, name: string, type = CustomFieldType.URL): FieldDefinitionDoc => ({
  _id: id,
  workspace_id: 'w1',
  space_id: 'sp1',
  name,
  type,
  options: [],
  list_ids: null,
  created_at: created,
  updated_at: created,
});
const task = (id: string, values: Array<[string, string | number | null]>, links?: FieldTaskDoc['links']): FieldTaskDoc => ({
  _id: id,
  workspace_id: 'w1',
  space_id: 'sp1',
  custom_fields: values.map(([fieldId, value]) => ({ fieldId, value })),
  links,
});
const noLinks = { figma: null, notion: null, printsFolder: null };

const preview = [
  def('it1', 'Item Type', CustomFieldType.DROPDOWN),
  def('it2', 'Item Type', CustomFieldType.DROPDOWN),
  def('fig', 'Figma'),
  def('ag', 'Agile Ceremony', CustomFieldType.DROPDOWN),
  def('ml', 'Meeting Location', CustomFieldType.DROPDOWN),
  def('dr', 'Date of Retrospective', CustomFieldType.DATE),
  def('rc', 'Retrospective Category', CustomFieldType.DROPDOWN),
  def('NO', 'NOTION'),
  def('no', 'Notion'),
  def('pf', 'Protótipo Figma'),
];

describe('CustomFieldConsolidationPlanner', () => {
  it('leva Figma, Protótipo Figma e Notion para os links da tarefa e apaga os 10 campos', () => {
    const tasks = [
      task('t1', [
        ['pf', 'https://figma.com/a'],
        ['it2', 'opt'],
      ]),
      task('t2', [['fig', 'https://figma.com/b']]),
      task('t3', [
        ['no', 'https://notion.so/x'],
        ['dr', 1700000000000],
      ]),
      task('t4', [
        ['ag', 'o1'],
        ['ml', 'o2'],
        ['rc', 'o3'],
      ]),
    ];
    const plan = CustomFieldConsolidationPlanner.plan(preview, tasks);
    expect(plan.remove.map(r => `${r.name}:${r.reason}:${r.into ?? '-'}`).sort()).toEqual(
      [
        'Agile Ceremony:removed:-',
        'Date of Retrospective:removed:-',
        'Figma:link:figma',
        'Item Type:removed:-',
        'Item Type:removed:-',
        'Meeting Location:removed:-',
        'NOTION:link:notion',
        'Notion:link:notion',
        'Protótipo Figma:link:figma',
        'Retrospective Category:removed:-',
      ].sort(),
    );
    expect(plan.tasks.map(t => [t.id, t.after])).toEqual([
      ['t1', { customFields: [], links: { ...noLinks, figma: 'https://figma.com/a' } }],
      ['t2', { customFields: [], links: { ...noLinks, figma: 'https://figma.com/b' } }],
      ['t3', { customFields: [], links: { ...noLinks, notion: 'https://notion.so/x' } }],
      ['t4', { customFields: [], links: noLinks }],
    ]);
    expect(plan.backedUpValues).toHaveLength(8);
    expect(plan.backedUpValues.filter(v => v.reason === 'link').map(v => v.fieldName)).toEqual(['Protótipo Figma', 'Figma', 'Notion']);
    expect(plan.conflicts).toEqual([]);
    expect(plan.typeMismatches).toEqual([]);
    expect(plan.linksAfter).toEqual({ figma: 2, notion: 1, printsFolder: 0 });
  });

  it('roda de novo sem mudar nada', () => {
    const plan = CustomFieldConsolidationPlanner.plan([], [task('t1', [['other', 'x']], { ...noLinks, figma: 'https://figma.com/a' })]);
    expect(plan.remove).toEqual([]);
    expect(plan.tasks).toEqual([]);
    expect(plan.linksAfter.figma).toBe(1);
  });

  it('mantém o primeiro valor e aponta o conflito, sem conflito quando o valor é igual', () => {
    const plan = CustomFieldConsolidationPlanner.plan(
      [def('fig', 'Figma'), def('pf', 'Protótipo Figma')],
      [
        task('t1', [
          ['fig', 'https://a'],
          ['pf', 'https://b'],
        ]),
        task('t2', [
          ['fig', 'https://same'],
          ['pf', 'https://same'],
        ]),
        task('t3', [['pf', 'https://c']], { figma: 'https://old' }),
      ],
    );
    expect(plan.conflicts).toEqual([
      { taskId: 't1', link: 'figma', kept: 'https://a', dropped: 'https://b', fromField: 'Protótipo Figma (pf)' },
      { taskId: 't3', link: 'figma', kept: 'https://old', dropped: 'https://c', fromField: 'Protótipo Figma (pf)' },
    ]);
    expect(plan.tasks.find(t => t.id === 't2')?.after.links.figma).toBe('https://same');
  });

  it('não toca em campos fora da lista e mantém os outros links', () => {
    const plan = CustomFieldConsolidationPlanner.plan(
      [def('no', 'Notion'), def('x', 'Owner URL')],
      [
        task(
          't1',
          [
            ['x', 'https://keep'],
            ['no', 'https://n'],
          ],
          { printsFolder: 'https://drive/x' },
        ),
      ],
    );
    expect(plan.remove.map(r => r.id)).toEqual(['no']);
    expect(plan.tasks[0].after).toEqual({ customFields: [{ fieldId: 'x', value: 'https://keep' }], links: { figma: null, notion: 'https://n', printsFolder: 'https://drive/x' } });
  });

  it('recusa virar link um campo que não é URL', () => {
    const plan = CustomFieldConsolidationPlanner.plan([def('pf', 'Protótipo Figma', CustomFieldType.DROPDOWN)], []);
    expect(plan.typeMismatches).toEqual([{ fieldId: 'pf', name: 'Protótipo Figma', type: CustomFieldType.DROPDOWN, link: 'figma' }]);
  });
});
