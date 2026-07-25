import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService, // Needed to retrieve password for validation
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null, isActive: true },
    });
    
    if (user) {
      const isMatch = await bcrypt.compare(pass, user.password);
      if (isMatch) {
        const { password, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = { sub: user.id, email: user.email, roleId: user.roleId };
    
    return {
      accessToken: this.jwtService.sign(payload),
      user, // Sanitized directly in validateUser
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: { email: registerDto.email, deletedAt: null },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Assign a default role of OFFICER for new registrations
    const role = await this.prisma.role.findUnique({
      where: { name: 'OFFICER' },
    });

    if (!role) {
      throw new NotFoundException('Default role OFFICER not found in the database');
    }

    const hashedPassword = await this.hashPassword(registerDto.password);

    const newUser = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        roleId: role.id,
      },
    });

    const { password, ...result } = newUser;
    return result;
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }
}
