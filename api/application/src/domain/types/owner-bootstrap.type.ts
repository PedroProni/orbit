export interface BootstrapOwnerOptions {
  email: string;
  name?: string;
  baseUrl: string;
  now: Date;
}

export interface BootstrapOwnerResult {
  email: string;
  userId: string;
  workspaceId: string;
  createdWorkspace: boolean;
  expiresAt: Date;
  link: string;
}
