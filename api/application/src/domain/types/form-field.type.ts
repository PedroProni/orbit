import { FormFieldTarget } from '@domain/enums/form.enums';

export interface FormField {
  id: string;
  label: string;
  required: boolean;
  target: FormFieldTarget;
}
