import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RequestActivationDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  badgeNumber: string;
}

export class VerifyOtpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  otpCode: string;
}

export class SetupAccountDto {
  @IsString()
  @IsNotEmpty()
  tempToken: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
