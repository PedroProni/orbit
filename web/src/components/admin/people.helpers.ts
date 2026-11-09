import { ACCESS_LINK_HASH_PREFIX, SET_PASSWORD_PATH } from '@/components/auth/auth.constants';
import { UserAccess } from '@/services/auth.types';
import { LOWER_ROLES } from './people.constants';
import { PersonAccessState } from './people.types';

export const accessStateOf = (person: UserAccess): PersonAccessState => (person.status === 'disabled' ? 'disabled' : person.hasPassword ? 'active' : 'pending');

export const canAdministerPerson = (actorId: string, actorRole: string, person: UserAccess): boolean => person.id !== actorId && (actorRole === 'owner' || (actorRole === 'admin' && LOWER_ROLES.includes(person.role)));

export const invitableRoles = (actorRole: string): string[] => (actorRole === 'owner' ? ['admin', ...LOWER_ROLES] : actorRole === 'admin' ? LOWER_ROLES : []);

export const accessLinkUrl = (origin: string, token: string): string => `${origin}${SET_PASSWORD_PATH}${ACCESS_LINK_HASH_PREFIX}${token}`;
