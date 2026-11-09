import { CreateTaskInput } from '@/services/orbit.types';
import { Task } from '@/types/api.types';

export interface OptimisticCreateOptions<T> {
  onCreated?: (task: Task, origin: T) => void;
  onRefused?: (error: Error & { status?: number }, origin: T) => void;
}

export interface OptimisticCreateVariables<T> {
  listId: string;
  spaceId: string;
  fallbackStatus: string;
  input: CreateTaskInput;
  origin: T;
}
