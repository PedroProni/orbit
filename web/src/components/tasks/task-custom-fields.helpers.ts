import { TaskCustomFieldValue } from '@/types/api.types';

export const withCustomFieldValue = (values: TaskCustomFieldValue[], fieldId: string, value: string | null): TaskCustomFieldValue[] => [...values.filter((item) => item.fieldId !== fieldId), ...(value === null ? [] : [{ fieldId, value }])];

export const customFieldDay = (value: TaskCustomFieldValue['value']): string => {
  if (value === null) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};
