import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ATTACHMENT_MAX_BYTES } from '@domain/constants/attachment.constant';
import { AttachmentGallery } from '@domain/enums/attachment.enums';

export class RequestUploadDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  filename!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  mimeType!: string;

  @IsInt()
  @Min(1)
  @Max(ATTACHMENT_MAX_BYTES)
  sizeBytes!: number;

  @IsOptional()
  @IsString()
  commentId?: string;

  @IsOptional()
  @IsEnum(AttachmentGallery)
  gallery?: AttachmentGallery;
}
