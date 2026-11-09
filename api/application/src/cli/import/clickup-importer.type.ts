export interface ImportedList {
  id: string;
  spaceId: string;
  archived: boolean;
}

export interface ImportedTask {
  raw: any;
  spaceId: string;
  archived: boolean;
}

export interface ClickupTaskComments {
  comments: any[];
  replies: any[];
}
