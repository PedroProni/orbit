import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ChatChannelKind } from '@domain/enums/chat.enums';

export class CreateChannelDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name!: string;

  @IsEnum(ChatChannelKind)
  kind!: ChatChannelKind;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberIds?: string[];
}

export class PostMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  bodyMd!: string;
}
