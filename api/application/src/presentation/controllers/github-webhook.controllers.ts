import { Controller, Headers, HttpCode, Post, Req, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Request } from 'express';
import { GITHUB_DELIVERY_HEADER, GITHUB_EVENT_HEADER, GITHUB_SIGNATURE_HEADER } from '@domain/constants/github-webhook.constant';
import { WebhookSignaturePolicy } from '@domain/policies/webhook-signature.policy';
import { EnvConfigService } from '@common/env/services/env-config.service';
import { HandleGithubWebhookUseCase } from '@application/use-cases/webhook/handle-github-webhook.use-case';

@ApiExcludeController()
@Controller('webhooks')
export class GithubWebhookController {
  constructor(
    private readonly env: EnvConfigService,
    private readonly handler: HandleGithubWebhookUseCase,
  ) {}

  @Post('github')
  @HttpCode(200)
  handle(@Req() req: Request & { rawBody?: Buffer }, @Headers(GITHUB_SIGNATURE_HEADER) signature?: string, @Headers(GITHUB_EVENT_HEADER) event?: string, @Headers(GITHUB_DELIVERY_HEADER) deliveryId?: string) {
    if (!WebhookSignaturePolicy.isValid(this.env.getGithubWebhookSecret(), req.rawBody, signature)) throw new UnauthorizedException('Invalid signature');
    if (!event || !deliveryId) throw new BadRequestException('Missing delivery headers');
    return this.handler.execute(deliveryId, event, req.body ?? {});
  }
}
