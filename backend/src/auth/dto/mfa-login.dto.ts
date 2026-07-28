import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class MfaLoginDto {
  @IsString()
  @IsNotEmpty()
  tempToken: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  mfaCode: string;
}
