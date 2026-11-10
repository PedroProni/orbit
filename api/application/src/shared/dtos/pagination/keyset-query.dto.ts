import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { KEYSET_CURSOR_MAX_LENGTH, KEYSET_CURSOR_PATTERN, KEYSET_MAX_LIMIT } from '@domain/constants/keyset-cursor.constant';

export class KeysetQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(KEYSET_MAX_LIMIT)
  limit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(KEYSET_CURSOR_MAX_LENGTH)
  @Matches(KEYSET_CURSOR_PATTERN)
  cursor?: string;
}
