import { IsIn, IsISO8601, IsOptional, IsString, Matches } from 'class-validator';
import { AUDIT_ACTION_FILTER_PATTERN, AUDIT_ENTITY_TYPES, AUDIT_REFERENCE_ID_PATTERN } from '@domain/constants/audit-log-filter.constant';
import { KeysetQueryDto } from '@shared/dtos/pagination/keyset-query.dto';

export class ListAuditLogsQueryDto extends KeysetQueryDto {
  @IsOptional()
  @IsString()
  @Matches(AUDIT_REFERENCE_ID_PATTERN)
  actorId?: string;

  @IsOptional()
  @IsString()
  @Matches(AUDIT_ACTION_FILTER_PATTERN)
  action?: string;

  @IsOptional()
  @IsString()
  @IsIn(AUDIT_ENTITY_TYPES)
  entityType?: string;

  @IsOptional()
  @IsString()
  @Matches(AUDIT_REFERENCE_ID_PATTERN)
  entityId?: string;

  @IsOptional()
  @IsString()
  @IsISO8601({ strict: true })
  from?: string;

  @IsOptional()
  @IsString()
  @IsISO8601({ strict: true })
  to?: string;
}
