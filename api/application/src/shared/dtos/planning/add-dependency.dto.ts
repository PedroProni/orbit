import { IsNotEmpty, IsString } from 'class-validator';

export class AddDependencyDto {
  @IsString()
  @IsNotEmpty()
  dependsOnId!: string;
}
