export interface Capabilities {
  loaded: boolean;
  isGuest: boolean;
  member: boolean;
  userId: string | null;
  canModerateComments: boolean;
  canManageAccess: boolean;
  canManageStructure: boolean;
}
