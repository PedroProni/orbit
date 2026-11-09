import { CustomFieldAliasPolicy } from './custom-field-alias.policy';

describe('CustomFieldAliasPolicy', () => {
  it('leva Figma e Protótipo Figma para o link do Figma, com ou sem acento e caixa', () => {
    expect(CustomFieldAliasPolicy.linkOf('Protótipo Figma')).toBe('figma');
    expect(CustomFieldAliasPolicy.linkOf('  prototipo   FIGMA ')).toBe('figma');
    expect(CustomFieldAliasPolicy.linkOf('Figma')).toBe('figma');
  });

  it('leva NOTION e Notion para o link do Notion', () => {
    expect(CustomFieldAliasPolicy.linkOf('NOTION')).toBe('notion');
    expect(CustomFieldAliasPolicy.linkOf('Notion')).toBe('notion');
  });

  it('não mapeia campos fora da lista', () => {
    expect(CustomFieldAliasPolicy.linkOf('Figma link')).toBeNull();
    expect(CustomFieldAliasPolicy.linkOf('Docs')).toBeNull();
    expect(CustomFieldAliasPolicy.linkOf('Item Type')).toBeNull();
  });

  it('reconhece os campos removidos', () => {
    for (const name of ['Item Type', 'Agile Ceremony', 'Meeting Location', 'Date of Retrospective', 'Retrospective Category']) expect(CustomFieldAliasPolicy.isRemoved(name)).toBe(true);
    expect(CustomFieldAliasPolicy.isRemoved('Figma')).toBe(false);
    expect(CustomFieldAliasPolicy.isRemoved('Notion')).toBe(false);
  });
});
