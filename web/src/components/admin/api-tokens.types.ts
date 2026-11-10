import { ApiToken, ApiTokenCreated, ApiTokenInput } from '@/services/api-token.types';

export type ApiTokenProblem = 'name' | 'scopes';

export interface ApiTokenRowProps {
  token: ApiToken;
  ownerName: string | null;
  onRevoke: (token: ApiToken) => void;
}

export interface ApiTokenDialogProps {
  open: boolean;
  available: string[];
  onSubmit: (input: ApiTokenInput) => Promise<ApiTokenCreated>;
  onCreated: (plain: string) => void;
  onClose: () => void;
}

export interface ApiTokenCreatedDialogProps {
  plain: string | null;
  onClose: () => void;
}
