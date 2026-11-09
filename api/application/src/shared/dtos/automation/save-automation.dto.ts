import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
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
  triggerStatus?: string | null;

  @IsEnum(AutomationActionType)
  actionType!: AutomationActionType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  actionValue!: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
