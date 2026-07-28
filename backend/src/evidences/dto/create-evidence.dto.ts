import { IsString, IsNotEmpty, IsOptional, IsEnum, MaxLength, IsDateString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { EvidenceCategory, EvidenceStatus } from '@prisma/client';

export class CreateEvidenceDto {
  @IsString()
  @IsNotEmpty()
  caseId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  evidenceNumber: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(EvidenceCategory)
  @IsNotEmpty()
  category: EvidenceCategory;

  @IsDateString()
  @IsNotEmpty()
  collectionDate: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  collectionLocation: string;

  @IsEnum(EvidenceStatus)
  @IsOptional()
  status?: EvidenceStatus;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  storageLocation?: string;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  isReadyForTransfer?: boolean;
}
