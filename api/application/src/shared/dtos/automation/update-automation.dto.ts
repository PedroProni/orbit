import { ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { AutomationActionType, AutomationTriggerType } from '@domain/enums/automation.enums';

export class UpdateAutomationDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  listId?: string | null;

  @IsOptional()
  @IsEnum(AutomationTriggerType)
  triggerType?: AutomationTriggerType;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  triggerValue?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  triggerStatus?: string | null;

  @IsOptional()
  @IsEnum(AutomationActionType)
  actionType?: AutomationActionType;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  actionValue?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  actionUserIds?: string[];

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  rotateSecret?: boolean;
}
