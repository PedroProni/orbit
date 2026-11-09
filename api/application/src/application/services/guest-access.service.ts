import { Inject, Injectable } from '@nestjs/common';
import { GUEST_ACCESS_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { GuestAccessRepository } from '@domain/repositories/guest-access.repository';
import { UserRole } from '@domain/enums/user.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';

@Injectable()
export class GuestAccessService {
  constructor(@Inject(GUEST_ACCESS_INJECT_TOKEN) private readonly access: GuestAccessRepository) {}

  async allowedListIds(principal: AuthPrincipal): Promise<string[] | null> {
    if (principal.role !== UserRole.GUEST) return null;
    const grant = await this.access.findOne({ workspace_id: principal.workspaceId, user_id: principal.userId });
    return grant ? grant.getListIds() : [];
  }
}
