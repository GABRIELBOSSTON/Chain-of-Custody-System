import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, IsBoolean } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  policeId: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsUUID()
  @IsNotEmpty()
  roleId: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
