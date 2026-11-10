'use client';

import { useQuery } from '@tanstack/react-query';
import { formService } from '@/services/form.service';
import { FormInput, FormUpdate } from '@/services/form.types';
import { useCapabilities } from './use-capabilities';
import { useInvalidating } from './use-workspace';
import { FORMS_KEY } from './use-admin.constants';

export const useForms = () => {
  const { canManageStructure } = useCapabilities();
  return useQuery({ queryKey: [FORMS_KEY], queryFn: formService.list, enabled: canManageStructure });
};

export const useCreateForm = () => useInvalidating((input: FormInput) => formService.create(input), [FORMS_KEY]);
export const useUpdateForm = () => useInvalidating(({ id, input }: FormUpdate) => formService.update(id, input), [FORMS_KEY]);
export const useRotateFormKey = () => useInvalidating((id: string) => formService.rotateKey(id), [FORMS_KEY]);
export const useDeleteForm = () => useInvalidating((id: string) => formService.remove(id), [FORMS_KEY]);
