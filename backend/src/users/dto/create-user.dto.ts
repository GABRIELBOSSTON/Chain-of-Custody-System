import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength, IsBoolean } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsUUID()
  @IsNotEmpty()
  roleId: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
