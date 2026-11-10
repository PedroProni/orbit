import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticated } from '@infrastructure/auth/authenticated.decorator';
import { CurrentPrincipal } from '@infrastructure/auth/current-principal.decorator';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { SCOPE_STRUCTURE_WRITE, SCOPE_TASKS_READ, SCOPE_TASKS_WRITE, SCOPE_USERS_MANAGE } from '@domain/constants/scopes.constant';
import { FormsUseCase } from '@application/use-cases/form/forms.use-case';
import { ChatUseCase } from '@application/use-cases/chat/chat.use-case';
import { UserGroupsUseCase } from '@application/use-cases/group/user-groups.use-case';
import { GuestAccessUseCase } from '@application/use-cases/user/guest-access.use-case';
import { InboxUseCase } from '@application/use-cases/inbox/inbox.use-case';
import { SaveFormDto } from '@shared/dtos/form/save-form.dto';
import { SubmitFormDto } from '@shared/dtos/form/submit-form.dto';
import { CreateChannelDto, PostMessageDto } from '@shared/dtos/chat/chat.dto';
import { SaveGroupDto } from '@shared/dtos/group/save-group.dto';
import { SetGuestAccessDto } from '@shared/dtos/guest/set-guest-access.dto';

@ApiTags('Forms')
@Controller('forms')
export class FormController {
  constructor(private readonly forms: FormsUseCase) {}

  @Get()
  @Authenticated(SCOPE_STRUCTURE_WRITE)
  list(@CurrentPrincipal() principal: AuthPrincipal) {
    return this.forms.list(principal);
  }

  @Post()
  @Authenticated(SCOPE_STRUCTURE_WRITE)
  create(@CurrentPrincipal() principal: AuthPrincipal, @Body() dto: SaveFormDto) {
    return this.forms.create(principal, dto);
  }

  @Patch(':id')
  @Authenticated(SCOPE_STRUCTURE_WRITE)
  update(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string, @Body() dto: SaveFormDto) {
    return this.forms.update(principal, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @Authenticated(SCOPE_STRUCTURE_WRITE)
  async remove(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string) {
    await this.forms.remove(principal, id);
  }
}

@ApiTags('Public forms')
@Controller('public/forms')
export class PublicFormController {
  constructor(private readonly forms: FormsUseCase) {}

  @Get(':key')
  definition(@Param('key') key: string) {
    return this.forms.publicDefinition(key);
  }

  @Post(':key')
  submit(@Param('key') key: string, @Body() dto: SubmitFormDto) {
    return this.forms.submit(key, dto.answers);
  }
}

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatUseCase) {}

  @Get('channels')
  @Authenticated(SCOPE_TASKS_READ)
  channels(@CurrentPrincipal() principal: AuthPrincipal) {
    return this.chat.listChannels(principal);
  }

  @Post('channels')
  @Authenticated(SCOPE_TASKS_WRITE)
  createChannel(@CurrentPrincipal() principal: AuthPrincipal, @Body() dto: CreateChannelDto) {
    return this.chat.createChannel(principal, dto);
  }

  @Get('channels/:id/messages')
  @Authenticated(SCOPE_TASKS_READ)
  messages(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string, @Query('before') before?: string) {
    return this.chat.listMessages(principal, id, before);
  }

  @Post('channels/:id/messages')
  @Authenticated(SCOPE_TASKS_WRITE)
  post(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string, @Body() dto: PostMessageDto) {
    return this.chat.post(principal, id, dto);
  }
}

@ApiTags('User groups')
@Controller('user-groups')
export class UserGroupController {
  constructor(private readonly groups: UserGroupsUseCase) {}

  @Get()
  @Authenticated(SCOPE_STRUCTURE_WRITE)
  list(@CurrentPrincipal() principal: AuthPrincipal) {
    return this.groups.list(principal);
  }

  @Post()
  @Authenticated(SCOPE_STRUCTURE_WRITE)
  create(@CurrentPrincipal() principal: AuthPrincipal, @Body() dto: SaveGroupDto) {
    return this.groups.create(principal, dto);
  }

  @Patch(':id')
  @Authenticated(SCOPE_STRUCTURE_WRITE)
  update(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string, @Body() dto: SaveGroupDto) {
    return this.groups.update(principal, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @Authenticated(SCOPE_STRUCTURE_WRITE)
  async remove(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string) {
    await this.groups.remove(principal, id);
  }
}

@ApiTags('Guests')
@Controller('users/:id/guest-access')
export class GuestAccessController {
  constructor(private readonly guests: GuestAccessUseCase) {}

  @Get()
  @Authenticated(SCOPE_USERS_MANAGE)
  get(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string) {
    return this.guests.get(principal, id);
  }

  @Put()
  @Authenticated(SCOPE_USERS_MANAGE)
  set(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string, @Body() dto: SetGuestAccessDto) {
    return this.guests.set(principal, id, dto.listIds);
  }
}

@ApiTags('Inbox')
@Controller('inbox')
export class InboxController {
  constructor(private readonly inbox: InboxUseCase) {}

  @Get()
  @Authenticated(SCOPE_TASKS_READ)
  get(@CurrentPrincipal() principal: AuthPrincipal) {
    return this.inbox.get(principal);
  }
}
