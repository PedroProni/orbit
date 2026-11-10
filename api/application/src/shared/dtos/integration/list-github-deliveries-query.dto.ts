import { IsIn, IsOptional, IsString } from 'class-validator';
import { GITHUB_DELIVERY_EVENTS } from '@domain/constants/github-integration.constant';
import { WebhookDeliveryOutcome } from '@domain/enums/webhook-delivery.enums';
import { KeysetQueryDto } from '@shared/dtos/pagination/keyset-query.dto';

export class ListGithubDeliveriesQueryDto extends KeysetQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(GITHUB_DELIVERY_EVENTS)
  event?: string;

  @IsOptional()
  @IsString()
  @IsIn(Object.values(WebhookDeliveryOutcome))
  outcome?: WebhookDeliveryOutcome;
}
