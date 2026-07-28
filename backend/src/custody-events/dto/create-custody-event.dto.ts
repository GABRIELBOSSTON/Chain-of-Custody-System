import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum, IsDateString } from 'class-validator';
import { CustodyAction } from '@prisma/client';

export class CreateCustodyEventDto {
  @IsUUID()
  @IsNotEmpty()
  evidenceId: string;

  @IsEnum(CustodyAction)
  @IsNotEmpty()
  action: CustodyAction;

  @IsUUID()
  @IsNotEmpty()
  actorId: string;

  @IsUUID()
  @IsOptional()
  recipientId?: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsDateString()
  @IsNotEmpty()
  eventTime: string | Date;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  externalOrganization?: string;

  @IsString()
  @IsOptional()
  externalRecipientName?: string;

  @IsString()
  @IsOptional()
  signatureName?: string;

  @IsString()
  @IsOptional()
  transferReason?: string;
}
