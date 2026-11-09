import { TaskLinksPolicy } from './task-links.policy';

describe('TaskLinksPolicy', () => {
  const empty = { figma: null, notion: null, printsFolder: null };

  it('normaliza o que vem do banco, incluindo documento antigo sem links', () => {
    expect(TaskLinksPolicy.normalize(undefined)).toEqual(empty);
    expect(TaskLinksPolicy.normalize({ figma: ' https://figma.com/a ', notion: '' })).toEqual({ figma: 'https://figma.com/a', notion: null, printsFolder: null });
  });

  it('troca só as chaves enviadas e limpa com null ou texto vazio', () => {
    const current = { figma: 'https://figma.com/a', notion: 'https://notion.so/b', printsFolder: null };
    expect(TaskLinksPolicy.merge(current, { notion: null })).toEqual({ figma: 'https://figma.com/a', notion: null, printsFolder: null });
    expect(TaskLinksPolicy.merge(current, { printsFolder: ' https://drive.google.com/x ', figma: '' })).toEqual({
      figma: null,
      notion: 'https://notion.so/b',
      printsFolder: 'https://drive.google.com/x',
    });
  });

  it('recusa link que não é http ou https', () => {
    for (const bad of ['javascript:alert(1)', 'ftp://x.test/a', 'figma.com/a', 'https://', `https://x.test/${'a'.repeat(2050)}`])
      expect(() => TaskLinksPolicy.merge(empty, { figma: bad })).toThrow('Invalid link for figma');
  });
});
