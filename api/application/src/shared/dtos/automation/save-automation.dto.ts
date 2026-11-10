import { ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { AutomationActionType, AutomationTriggerType } from '@domain/enums/automation.enums';

export class SaveAutomationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  listId?: string | null;

  @IsEnum(AutomationTriggerType)
  triggerType!: AutomationTriggerType;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  triggerValue?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  triggerStatus?: string | null;

  @IsEnum(AutomationActionType)
  actionType!: AutomationActionType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  actionValue!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  actionUserIds?: string[];

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
