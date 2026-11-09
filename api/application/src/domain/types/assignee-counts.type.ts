export interface AssigneeCount {
  assigneeId: string;
  count: number;
}

export interface AssigneeCounts {
  total: number;
  unassigned: number;
  byAssignee: AssigneeCount[];
}
