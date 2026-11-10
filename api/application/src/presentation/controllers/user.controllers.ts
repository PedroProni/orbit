import { Body, Controller, Delete, Get, Header, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticated } from '@infrastructure/auth/authenticated.decorator';
import { CurrentPrincipal } from '@infrastructure/auth/current-principal.decorator';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { SCOPE_USERS_INVITE, SCOPE_USERS_MANAGE, SCOPE_USERS_READ } from '@domain/constants/scopes.constant';
import { ListUsersUseCase } from '@application/use-cases/user/list-users.use-case';
import { ChangeUserRoleUseCase } from '@application/use-cases/user/change-user-role.use-case';
import { ChangeUserStatusUseCase } from '@application/use-cases/user/change-user-status.use-case';
import { InviteUserUseCase } from '@application/use-cases/user/invite-user.use-case';
import { GenerateAccessLinkUseCase } from '@application/use-cases/user/generate-access-link.use-case';
import { RevokeUserSessionsUseCase } from '@application/use-cases/user/revoke-user-sessions.use-case';
import { ListUserAccessUseCase } from '@application/use-cases/user/list-user-access.use-case';
import { InviteUserDto } from '@shared/dtos/user/invite-user.dto';
import { ChangeUserRoleDto } from '@shared/dtos/user/change-user-role.dto';
import { ChangeUserStatusDto } from '@shared/dtos/user/change-user-status.dto';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(
    private readonly listUsers: ListUsersUseCase,
    private readonly changeRole: ChangeUserRoleUseCase,
    private readonly changeStatus: ChangeUserStatusUseCase,
    private readonly inviteUser: InviteUserUseCase,
    private readonly accessLink: GenerateAccessLinkUseCase,
    private readonly revokeSessions: RevokeUserSessionsUseCase,
    private readonly listAccess: ListUserAccessUseCase,
  ) {}

  @Get()
  @Authenticated(SCOPE_USERS_READ)
  list(@CurrentPrincipal() principal: AuthPrincipal) {
    return this.listUsers.execute(principal);
  }

  @Get('access')
  @Authenticated(SCOPE_USERS_INVITE)
  access(@CurrentPrincipal() principal: AuthPrincipal) {
    return this.listAccess.execute(principal);
  }

  @Post('invite')
  @Header('Cache-Control', 'no-store')
  @Authenticated(SCOPE_USERS_INVITE)
  invite(@CurrentPrincipal() principal: AuthPrincipal, @Body() dto: InviteUserDto) {
    return this.inviteUser.execute(principal, dto);
  }

  @Post(':id/access-link')
  @Header('Cache-Control', 'no-store')
  @Authenticated(SCOPE_USERS_INVITE)
  link(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string) {
    return this.accessLink.execute(principal, id);
  }

  @Delete(':id/sessions')
  @Authenticated(SCOPE_USERS_INVITE)
  sessions(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string) {
    return this.revokeSessions.execute(principal, id);
  }

  @Patch(':id/role')
  @Authenticated(SCOPE_USERS_INVITE)
  role(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string, @Body() dto: ChangeUserRoleDto) {
    return this.changeRole.execute(principal, id, dto.role);
  }

  @Patch(':id/status')
  @Authenticated(SCOPE_USERS_MANAGE)
  status(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string, @Body() dto: ChangeUserStatusDto) {
    return this.changeStatus.execute(principal, id, dto.status);
  }
}
