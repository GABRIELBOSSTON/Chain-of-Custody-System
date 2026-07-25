import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { EvidenceService } from './evidence.service';
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import { UpdateEvidenceDto } from './dto/update-evidence.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('evidence')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVESTIGATOR)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createEvidenceDto: CreateEvidenceDto) {
    return this.evidenceService.create(createEvidenceDto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVESTIGATOR, Role.AUDITOR)
  async findAll() {
    return this.evidenceService.findAll();
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVESTIGATOR, Role.AUDITOR)
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.evidenceService.findById(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVESTIGATOR)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEvidenceDto: UpdateEvidenceDto,
  ) {
    return this.evidenceService.update(id, updateEvidenceDto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.evidenceService.delete(id);
  }
}
