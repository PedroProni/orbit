import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticated } from '@infrastructure/auth/authenticated.decorator';
import { CurrentPrincipal } from '@infrastructure/auth/current-principal.decorator';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { SCOPE_TASKS_READ } from '@domain/constants/scopes.constant';
import { ListNotificationsUseCase } from '@application/use-cases/notification/list-notifications.use-case';
import { MarkNotificationsReadUseCase } from '@application/use-cases/notification/mark-notifications-read.use-case';
import { MarkReadDto } from '@shared/dtos/notification/mark-read.dto';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly listNotifications: ListNotificationsUseCase,
    private readonly markRead: MarkNotificationsReadUseCase,
  ) {}

  @Get()
  @Authenticated(SCOPE_TASKS_READ)
  list(@CurrentPrincipal() principal: AuthPrincipal, @Query('unread') unread?: string) {
    return this.listNotifications.execute(principal, unread === 'true');
  }

  @Post('read')
  @HttpCode(204)
  @Authenticated(SCOPE_TASKS_READ)
  async read(@CurrentPrincipal() principal: AuthPrincipal, @Body() dto: MarkReadDto) {
    await this.markRead.execute(principal, dto.ids ?? null);
  }
}
