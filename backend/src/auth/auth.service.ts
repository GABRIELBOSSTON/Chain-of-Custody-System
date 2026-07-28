import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { generateSecret, verifySync, generateURI } from 'otplib';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { MfaLoginDto } from './dto/mfa-login.dto';
import { RequestActivationDto, VerifyOtpDto, SetupAccountDto } from './dto/activation.dto';
import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null, isActive: true },
      include: { mfaSecret: true },
    });
    
    if (user && user.password) {
      const isMatch = await bcrypt.compare(pass, user.password);
      if (isMatch) {
        delete (user as any).password;
        return user;
      }
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.mfaSecret || !user.mfaSecret.isEnabled) {
      throw new UnauthorizedException('MFA is not enabled for this account. Please activate your account first.');
    }

    // Step 1: Return a temporary token for MFA verification
    const tempPayload = { sub: user.id, email: user.email, type: 'MFA_REQUIRED' };
    const tempToken = this.jwtService.sign(tempPayload, { expiresIn: '5m' });

    return {
      mfaRequired: true,
      tempToken,
    };
  }

  async verifyMfa(mfaDto: MfaLoginDto) {
    try {
      const decoded = this.jwtService.verify(mfaDto.tempToken);
      if (decoded.type !== 'MFA_REQUIRED') throw new UnauthorizedException('Invalid token type');

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        include: { mfaSecret: true },
      });

      if (!user || !user.mfaSecret) throw new UnauthorizedException('User or MFA Secret not found');

      const isValid = verifySync({ token: mfaDto.mfaCode, secret: user.mfaSecret.secret });
      
      if (!isValid) {
        throw new UnauthorizedException('Invalid MFA code');
      }

      const payload: JwtPayload = { sub: user.id, email: user.email, roleId: user.roleId };
      const { password, ...result } = user;

      // Create Audit Log for Login
      await this.prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_LOGIN',
          entityType: 'Auth',
          description: `User ${user.email} logged in successfully via MFA.`,
        }
      });

      return {
        accessToken: this.jwtService.sign(payload),
        user: result,
      };
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired temporary token');
    }
  }

  // Activation Flow

  async requestActivation(dto: RequestActivationDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
      include: { policeProfile: true, mfaSecret: true },
    });

    if (!user || !user.policeProfile) {
      throw new NotFoundException('User or Police Profile not found');
    }

    if (user.policeProfile.policeId !== dto.badgeNumber) {
      throw new UnauthorizedException('Badge number does not match our records');
    }

    if (user.mfaSecret && user.mfaSecret.isEnabled) {
      throw new ConflictException('Account is already activated');
    }

    // Generate 6 digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60000); // 10 mins

    await this.prisma.oTPVerification.create({
      data: {
        userId: user.id,
        otpCode,
        expiresAt,
      },
    });

    // SIMULATED DELIVERY
    // [SIMULATED SMS/EMAIL] In a real system, this sends the OTP via external service.
    // We suppress raw console.log and use the standard NestJS logger or keep it silent in production.

    return { message: 'OTP has been sent to your registered contact.' };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) throw new NotFoundException('User not found');

    const otpRecord = await this.prisma.oTPVerification.findFirst({
      where: {
        userId: user.id,
        otpCode: dto.otpCode,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Mark as used
    await this.prisma.oTPVerification.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    const tempPayload = { sub: user.id, email: user.email, type: 'ACCOUNT_SETUP' };
    const tempToken = this.jwtService.sign(tempPayload, { expiresIn: '15m' });

    return { tempToken };
  }

  async setupAccount(dto: SetupAccountDto) {
    try {
      const decoded = this.jwtService.verify(dto.tempToken);
      if (decoded.type !== 'ACCOUNT_SETUP') throw new UnauthorizedException('Invalid token type');

      const user = await this.prisma.user.findUnique({ where: { id: decoded.sub } });
      if (!user) throw new NotFoundException('User not found');

      // Hash new password
      const hashedPassword = await bcrypt.hash(dto.password, 12);

      // Generate MFA Secret
      const secret = generateSecret({ length: 20 });
      const otpauthUrl = generateURI({ label: user.email, issuer: 'Chain of Custody FCCMS', secret });
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

      // Save password and MFA secret in a transaction
      await this.prisma.$transaction(async (prisma) => {
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        });

        // Ensure no previous secrets exist (clean up if replacing)
        await prisma.mFASecret.deleteMany({ where: { userId: user.id } });

        await prisma.mFASecret.create({
          data: {
            userId: user.id,
            secret,
            isEnabled: true,
          },
        });
      });

      return {
        message: 'Account activated successfully. Please scan this QR code with Google Authenticator.',
        qrCodeUrl: qrCodeDataUrl,
      };
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired setup token');
    }
  }
}
