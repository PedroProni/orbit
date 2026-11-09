import { cn } from '@/lib/cn';
import { SkeletonProps } from './skeleton.types';

export function Skeleton({ className, width, height }: SkeletonProps) {
  return <div aria-hidden="true" className={cn('skeleton', className)} style={{ width, height }} />;
}
