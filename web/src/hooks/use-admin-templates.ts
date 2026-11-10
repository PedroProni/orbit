'use client';

import { useQuery } from '@tanstack/react-query';
import { templateService } from '@/services/template.service';
import { TemplateInput, TemplateUpdate } from '@/services/template.types';
import { useCapabilities } from './use-capabilities';
import { useInvalidating } from './use-workspace';
import { TEMPLATES_KEY } from './use-admin.constants';

export const useAllTemplates = () => {
  const { canManageStructure } = useCapabilities();
  return useQuery({ queryKey: [TEMPLATES_KEY, 'all'], queryFn: templateService.list, enabled: canManageStructure });
};

export const useCreateTemplate = () => useInvalidating((input: TemplateInput) => templateService.create(input), [TEMPLATES_KEY]);
export const useUpdateTemplate = () => useInvalidating(({ id, input }: TemplateUpdate) => templateService.update(id, input), [TEMPLATES_KEY]);
export const useDeleteTemplate = () => useInvalidating((id: string) => templateService.remove(id), [TEMPLATES_KEY]);
