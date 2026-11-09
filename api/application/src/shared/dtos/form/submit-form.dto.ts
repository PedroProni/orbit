import { IsObject } from 'class-validator';

export class SubmitFormDto {
  @IsObject()
  answers!: Record<string, string>;
}
