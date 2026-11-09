import { Body, Controller, Delete, Get, HttpCode, Param, Post, Redirect, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { Authenticated } from '@infrastructure/auth/authenticated.decorator';
import { GuestReadable } from '@infrastructure/auth/guest-readable.decorator';
import { CurrentPrincipal } from '@infrastructure/auth/current-principal.decorator';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { SCOPE_ATTACHMENTS_WRITE, SCOPE_TASKS_READ } from '@domain/constants/scopes.constant';
import { RequestUploadUseCase } from '@application/use-cases/attachment/request-upload.use-case';
import { ConfirmAttachmentUseCase } from '@application/use-cases/attachment/confirm-attachment.use-case';
import { DownloadAttachmentUseCase } from '@application/use-cases/attachment/download-attachment.use-case';
import { AttachmentContentUseCase } from '@application/use-cases/attachment/attachment-content.use-case';
import { ListAttachmentsUseCase } from '@application/use-cases/attachment/list-attachments.use-case';
import { DeleteAttachmentUseCase } from '@application/use-cases/attachment/delete-attachment.use-case';
import { RequestUploadDto } from '@shared/dtos/attachment/request-upload.dto';
import { ATTACHMENT_CONTENT_CACHE_CONTROL } from '@domain/constants/attachment.constant';

@ApiTags('Attachments')
@Controller()
export class AttachmentController {
  constructor(
    private readonly requestUpload: RequestUploadUseCase,
    private readonly confirmAttachment: ConfirmAttachmentUseCase,
    private readonly downloadAttachment: DownloadAttachmentUseCase,
    private readonly attachmentContent: AttachmentContentUseCase,
    private readonly listAttachments: ListAttachmentsUseCase,
    private readonly deleteAttachment: DeleteAttachmentUseCase,
  ) {}

  @Get('tasks/:taskId/attachments')
  @Authenticated(SCOPE_TASKS_READ)
  list(@CurrentPrincipal() principal: AuthPrincipal, @Param('taskId') taskId: string) {
    return this.listAttachments.execute(principal, taskId);
  }

  @Post('tasks/:taskId/attachments')
  @Authenticated(SCOPE_ATTACHMENTS_WRITE)
  request(@CurrentPrincipal() principal: AuthPrincipal, @Param('taskId') taskId: string, @Body() dto: RequestUploadDto) {
    return this.requestUpload.execute(principal, taskId, dto);
  }

  @Post('attachments/:id/confirm')
  @HttpCode(200)
  @Authenticated(SCOPE_ATTACHMENTS_WRITE)
  confirm(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string) {
    return this.confirmAttachment.execute(principal, id);
  }

  @Get('attachments/:id/download')
  @Authenticated(SCOPE_TASKS_READ)
  download(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string) {
    return this.downloadAttachment.execute(principal, id);
  }

  @Get('attachments/:id/content')
  @Redirect()
  @GuestReadable()
  @Authenticated(SCOPE_TASKS_READ)
  async content(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string, @Res({ passthrough: true }) response: Response) {
    const target = await this.attachmentContent.execute(principal, id);
    response.setHeader('Cache-Control', ATTACHMENT_CONTENT_CACHE_CONTROL);
    return target;
  }

  @Delete('attachments/:id')
  @HttpCode(204)
  @Authenticated(SCOPE_ATTACHMENTS_WRITE)
  async remove(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string) {
    await this.deleteAttachment.execute(principal, id);
  }
}
