import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { CaseStatus } from '@prisma/client';

export class CreateCaseDto {
  @IsString()
  @IsNotEmpty()
  caseNumber: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(CaseStatus)
  @IsOptional()
  status?: CaseStatus;
}
