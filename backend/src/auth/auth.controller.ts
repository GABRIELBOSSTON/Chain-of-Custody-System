import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { MfaLoginDto } from './dto/mfa-login.dto';
import { RequestActivationDto, VerifyOtpDto, SetupAccountDto } from './dto/activation.dto';
import { Public } from '../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('login/mfa')
  @HttpCode(HttpStatus.OK)
  async verifyMfa(@Body() mfaDto: MfaLoginDto) {
    return this.authService.verifyMfa(mfaDto);
  }

  @Public()
  @Post('activation/request')
  @HttpCode(HttpStatus.OK)
  async requestActivation(@Body() dto: RequestActivationDto) {
    return this.authService.requestActivation(dto);
  }

  @Public()
  @Post('activation/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Public()
  @Post('activation/setup')
  @HttpCode(HttpStatus.OK)
  async setupAccount(@Body() dto: SetupAccountDto) {
    return this.authService.setupAccount(dto);
  }
}
