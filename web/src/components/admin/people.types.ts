import { IssuedAccessLink, UserAccess } from '@/services/auth.types';

export interface AccessLinkDialogProps {
  name: string;
  link: IssuedAccessLink | null;
  onClose: () => void;
}

export interface InviteDialogProps {
  open: boolean;
  actorRole: string;
  onClose: () => void;
  onInvited: (name: string, link: IssuedAccessLink) => void;
}

export interface PersonRowProps {
  person: UserAccess;
  actorId: string;
  actorRole: string;
  onLink: (person: UserAccess) => void;
  onEndSessions: (person: UserAccess) => void;
  busy: boolean;
}

export type PersonAccessState = 'disabled' | 'active' | 'pending';
