'use client';

import { useQuery } from '@tanstack/react-query';
import { workspaceSummaryService } from '@/services/workspace-summary.service';
import { useCapabilities } from './use-capabilities';
import { WORKSPACE_SUMMARY_KEY } from './use-admin.constants';

export const useWorkspaceSummary = () => {
  const { canReadAudit } = useCapabilities();
  return useQuery({ queryKey: [WORKSPACE_SUMMARY_KEY], queryFn: workspaceSummaryService.get, enabled: canReadAudit });
};
