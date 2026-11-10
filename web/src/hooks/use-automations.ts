'use client';

import { useQuery } from '@tanstack/react-query';
import { automationService } from '@/services/automation.service';
import { AutomationInput, AutomationUpdate } from '@/services/automation.types';
import { useCapabilities } from './use-capabilities';
import { useInvalidating } from './use-workspace';
import { AUTOMATIONS_KEY } from './use-admin.constants';

export const useAutomations = () => {
  const { canManageStructure } = useCapabilities();
  return useQuery({ queryKey: [AUTOMATIONS_KEY], queryFn: automationService.list, enabled: canManageStructure });
};

export const useAutomationRuns = (id: string, open: boolean) => {
  const { canManageStructure } = useCapabilities();
  return useQuery({ queryKey: [AUTOMATIONS_KEY, id, 'runs'], queryFn: () => automationService.runs(id), enabled: canManageStructure && open });
};

export const useCreateAutomation = () => useInvalidating((input: AutomationInput) => automationService.create(input), [AUTOMATIONS_KEY]);
export const useUpdateAutomation = () => useInvalidating(({ id, input }: AutomationUpdate) => automationService.update(id, input), [AUTOMATIONS_KEY]);
export const useDeleteAutomation = () => useInvalidating((id: string) => automationService.remove(id), [AUTOMATIONS_KEY]);
