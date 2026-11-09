import { StatusType } from '@domain/enums/space.enums';

export interface TaskStatusDefinition {
  name: string;
  color: string;
  type: StatusType;
  order: number;
}
