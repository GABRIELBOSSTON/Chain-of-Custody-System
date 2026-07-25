import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { userSelect } from './constants/user-select';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      select: userSelect,
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: userSelect,
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      select: userSelect,
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
  }

  async create(createUserDto: CreateUserDto) {
    throw new BadRequestException(
      'User creation is temporarily disabled until Auth module is implemented.'
    );
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findById(id); // Ensure user exists

    if (updateUserDto.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (existingEmail && existingEmail.id !== id) {
        throw new ConflictException('Email already in use by another account');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: userSelect,
    });
  }

  async delete(id: string) {
    await this.findById(id); // Ensure user exists

    // TODO: Implement deletedBy relation once Authentication provides current user context
    // TODO: Implement AuditLog insertion for soft delete action
    
    // We use soft-delete per architectural business rules
    return this.prisma.user.update({
      where: { id },
      data: { 
        deletedAt: new Date(),
        isActive: false
      },
      select: userSelect,
    });
  }
}
