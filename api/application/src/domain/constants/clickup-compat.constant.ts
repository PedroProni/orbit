export const CLICKUP_PRIORITIES: Record<string, { id: string; color: string; orderindex: string }> = {
  urgent: { id: '1', color: '#f50000', orderindex: '1' },
  high: { id: '2', color: '#ffcc00', orderindex: '2' },
  normal: { id: '3', color: '#6fddff', orderindex: '3' },
  low: { id: '4', color: '#d8d8d8', orderindex: '4' },
};

export const CLICKUP_PRIORITY_BY_ID: Record<string, string> = { '1': 'urgent', '2': 'high', '3': 'normal', '4': 'low' };
export const CLICKUP_PAGE_SIZE = 100;
export const CLICKUP_USER_COLOR = '#7b68ee';
