export const TABLE_COLUMNS = ['title', 'status', 'priority', 'assignee', 'dueDate', 'points', 'updatedAt'] as const;
export type TableColumn = (typeof TABLE_COLUMNS)[number];
export const PRIORITY_RANK: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
