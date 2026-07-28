import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { CasesService } from './cases.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('cases')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CasesController {
  constructor(private readonly casesService: CasesService) { }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVESTIGATOR)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createCaseDto: CreateCaseDto,
    @CurrentUser() user: { id: string; roleId: string; role?: { name: string } }
  ) {
    return this.casesService.create(createCaseDto, user.id, user.role?.name);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVESTIGATOR, Role.AUDITOR)
  async findAll(@CurrentUser() user: { id: string; role?: { name: string } }) {
    return this.casesService.findAll(user);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVESTIGATOR, Role.AUDITOR)
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.casesService.findById(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVESTIGATOR)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCaseDto: UpdateCaseDto,
    @CurrentUser() user: { id: string }
  ) {
    return this.casesService.update(id, updateCaseDto, user.id);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string }
  ) {
    return this.casesService.delete(id, user.id);
  }
}
