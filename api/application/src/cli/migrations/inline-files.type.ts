export type InlineFileOwnerKind = 'task' | 'comment';

export interface InlineFileSource {
  id: string;
  url: string;
}

export interface InlineFileAttachment {
  id: string;
  taskId: string;
  filename: string;
  mimeType: string;
  confirmed: boolean;
}

export interface InlineFileOwner {
  kind: InlineFileOwnerKind;
  id: string;
  workspaceId: string;
  taskId: string;
  text: string;
}

export interface InlineFileLink {
  url: string;
  attachmentId: string;
}

export interface InlineFileChange {
  kind: InlineFileOwnerKind;
  id: string;
  workspaceId: string;
  taskId: string;
  before: string;
  after: string;
  links: InlineFileLink[];
}

export interface InlineFileUnmatched {
  kind: InlineFileOwnerKind;
  id: string;
  url: string;
  reason: 'no-source' | 'not-stored' | 'other-task';
}

export interface InlineFilePlan {
  changes: InlineFileChange[];
  unmatched: InlineFileUnmatched[];
  links: number;
}
