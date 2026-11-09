export interface CountFacet {
  n: number;
}

export interface AssigneeGroupFacet {
  _id: string;
  count: number;
}

export interface AssigneeCountFacets {
  total: CountFacet[];
  unassigned: CountFacet[];
  byAssignee: AssigneeGroupFacet[];
}
