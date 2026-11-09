import { describe, expect, it } from 'vitest';
import { statusColor } from '@/components/tasks/task-helpers';

const status = (name: string, color = '#123456') => ({ name, color, type: 'open' as const, order: 0 });

describe('statusColor', () => {
  it('uses the token of a known status whatever the case', () => {
    expect(statusColor(status('In Progress'))).toBe('var(--status-progress)');
    expect(statusColor(status('done'))).toBe('var(--status-done)');
  });

  it('keeps the color of a custom status', () => {
    expect(statusColor(status('Waiting vendor'))).toBe('#123456');
  });
});
