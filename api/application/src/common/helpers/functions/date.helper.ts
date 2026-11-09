export function toDateOrNull(value: string | null | undefined): Date | null {
  return value ? new Date(value) : null;
}
