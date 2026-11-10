import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { PUBLIC_FORM_HONEYPOT_MAX_LENGTH } from '@domain/constants/public-form.constant';

export class SubmitFormDto {
  @IsObject()
  answers!: Record<string, string>;

  @IsOptional()
  @IsString()
  @MaxLength(PUBLIC_FORM_HONEYPOT_MAX_LENGTH)
  website?: string;
}
