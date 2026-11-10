export interface Capabilities {
  loaded: boolean;
  isGuest: boolean;
  member: boolean;
  isViewer: boolean;
  canWrite: boolean;
  userId: string | null;
  canModerateComments: boolean;
  canManageAccess: boolean;
  canManageStructure: boolean;
  canReadAudit: boolean;
  isOwner: boolean;
}
