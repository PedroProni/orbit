export interface SetModification {
  add: string[];
  remove: string[];
}

export interface TaskSetModifications {
  tags?: SetModification;
  assigneeIds?: SetModification;
}
