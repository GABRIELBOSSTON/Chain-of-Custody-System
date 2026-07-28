import { IsString, IsNotEmpty, IsDateString, IsUUID, MaxLength } from 'class-validator';

export class CreateCourtPresentationDto {
  @IsUUID()
  @IsNotEmpty()
  evidenceId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  courtName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  exhibitNumber: string;

  @IsDateString()
  @IsNotEmpty()
  presentedDate: string | Date;
}
