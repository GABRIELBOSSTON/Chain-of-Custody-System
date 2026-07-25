import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateEvidenceDto {
  @IsUUID()
  @IsNotEmpty()
  caseId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  currentLocation: string;
}
