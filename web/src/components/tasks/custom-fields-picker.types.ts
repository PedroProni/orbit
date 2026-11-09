import { TaskCustomFieldValue } from '@/types/api.types';

export interface CustomFieldsPickerProps {
  spaceId: string;
  values: TaskCustomFieldValue[];
  onChange: (values: TaskCustomFieldValue[]) => void;
}
