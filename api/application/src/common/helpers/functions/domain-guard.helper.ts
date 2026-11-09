import { BadRequestException } from '@nestjs/common';

export function guardDomain<T>(action: () => T): T {
  try {
    return action();
  } catch (error) {
    if (error instanceof Error && !(error as { getStatus?: () => number }).getStatus) throw new BadRequestException(error.message);
    throw error;
  }
}
