export const TABLE_COLUMNS = ['title', 'status', 'priority', 'assignee', 'dueDate', 'points', 'updatedAt'] as const;
export type TableColumn = (typeof TABLE_COLUMNS)[number];
export const PRIORITY_RANK: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
export const TABLE_TAGS_SHOWN = 2;
export const TABLE_COLUMN_WIDTH: Record<TableColumn | 'rowNumber' | 'tags', string> = {
  rowNumber: 'w-11',
  title: 'w-[420px]',
  status: 'w-[170px]',
  priority: 'w-[180px]',
  assignee: 'w-[190px]',
  dueDate: 'w-[110px]',
  tags: 'w-[200px]',
  points: 'w-[80px]',
  updatedAt: 'w-[100px]',
};
export const TABLE_CELL_CLASS = 'h-8 border-r border-line px-2 last:border-r-0';
