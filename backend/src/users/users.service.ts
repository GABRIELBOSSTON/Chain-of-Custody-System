import { createAuditLog } from '../audit-logs/utils/audit-logger';
import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
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

  async getRoles() {
    return this.prisma.role.findMany();
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

  async create(createUserDto: CreateUserDto, actorId?: string) {
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });
    if (existingEmail) throw new ConflictException('Email already in use');

    const existingPoliceId = await this.prisma.policeProfile.findUnique({
      where: { policeId: createUserDto.policeId },
    });
    if (existingPoliceId) throw new ConflictException('Police ID already in use');

    const role = await this.prisma.role.findUnique({
      where: { id: createUserDto.roleId },
    });
    if (!role) throw new NotFoundException(`Role with ID ${createUserDto.roleId} not found`);

    const dummyPassword = await bcrypt.hash(Math.random().toString(36).slice(-10), 12);

    const newUser = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: dummyPassword,
        roleId: createUserDto.roleId,
        isActive: createUserDto.isActive ?? true,
        policeProfile: {
          create: {
            policeId: createUserDto.policeId,
            fullName: createUserDto.fullName,
          }
        }
      },
      select: userSelect,
    });

    await createAuditLog(this.prisma, {
      data: {
        userId: actorId || null,
        action: 'CREATE_USER',
        entityId: newUser.id,
        entityType: 'User',
        description: `Created user with email ${newUser.email}`,
      }
    });

    return newUser;
  }

  async update(id: string, updateUserDto: UpdateUserDto, actorId?: string) {
    await this.findById(id); // Ensure user exists

    if (updateUserDto.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (existingEmail && existingEmail.id !== id) {
        throw new ConflictException('Email already in use by another account');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: userSelect,
    });

    await createAuditLog(this.prisma, {
      data: {
        userId: actorId || null,
        action: 'UPDATE_USER',
        entityId: updatedUser.id,
        entityType: 'User',
        description: `Updated user with email ${updatedUser.email}`,
      }
    });

    return updatedUser;
  }

  async delete(id: string, actorId?: string) {
    const user = await this.findById(id); // Ensure user exists

    // We use soft-delete per architectural business rules
    const deletedUser = await this.prisma.user.update({
      where: { id },
      data: { 
        deletedAt: new Date(),
        isActive: false,
        deletedBy: actorId || null
      },
      select: userSelect,
    });

    await createAuditLog(this.prisma, {
      data: {
        userId: actorId || null,
        action: 'DELETE_USER',
        entityId: deletedUser.id,
        entityType: 'User',
        description: `Deleted user with email ${user.email}`,
      }
    });

    return deletedUser;
  }
}
