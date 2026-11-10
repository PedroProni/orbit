import { TaskTemplate } from '@/types/workspace.types';
import { TemplateInput } from '@/services/template.types';
import { TEMPLATE_ESTIMATE_MAX_MINUTES, TEMPLATE_NO_PRIORITY, TEMPLATE_TAG_SEPARATOR } from './templates.constants';
import { TemplateDraft, TemplateProblem } from './templates.types';

export const emptyTemplateDraft = (spaceId: string): TemplateDraft => ({ spaceId, name: '', titleTemplate: '', descriptionMd: '', tags: '', priority: TEMPLATE_NO_PRIORITY, taskKind: 'task', estimate: '' });

export const draftFromTemplate = (template: TaskTemplate): TemplateDraft => ({
  spaceId: template.spaceId,
  name: template.name,
  titleTemplate: template.titleTemplate,
  descriptionMd: template.descriptionMd,
  tags: template.tags.join(`${TEMPLATE_TAG_SEPARATOR} `),
  priority: template.priority ?? TEMPLATE_NO_PRIORITY,
  taskKind: template.taskKind,
  estimate: template.estimateMinutes === null ? '' : String(template.estimateMinutes),
});

export const parseTemplateTags = (text: string): string[] => [
  ...new Set(
    text
      .split(TEMPLATE_TAG_SEPARATOR)
      .map((tag) => tag.trim())
      .filter(Boolean),
  ),
];

const parseEstimate = (text: string): number | null | undefined => {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (!/^\d+$/.test(trimmed)) return undefined;
  const minutes = Number(trimmed);
  return minutes <= TEMPLATE_ESTIMATE_MAX_MINUTES ? minutes : undefined;
};

export const templateProblem = (draft: TemplateDraft): TemplateProblem | null => {
  if (!draft.spaceId) return 'space';
  if (!draft.name.trim()) return 'name';
  if (!draft.titleTemplate.trim()) return 'title';
  if (parseEstimate(draft.estimate) === undefined) return 'estimate';
  return null;
};

export const draftToTemplateInput = (draft: TemplateDraft): TemplateInput => ({
  spaceId: draft.spaceId,
  name: draft.name.trim(),
  titleTemplate: draft.titleTemplate.trim(),
  descriptionMd: draft.descriptionMd,
  tags: parseTemplateTags(draft.tags),
  priority: draft.priority === TEMPLATE_NO_PRIORITY ? null : draft.priority,
  taskKind: draft.taskKind,
  estimateMinutes: parseEstimate(draft.estimate) ?? null,
});
