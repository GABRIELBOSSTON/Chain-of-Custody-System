import { IsDateString, IsNotEmpty } from 'class-validator';

export class ReturnCourtPresentationDto {
  @IsDateString()
  @IsNotEmpty()
  returnedDate: string | Date;
}
