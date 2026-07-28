import { Controller, Get, Post, Body, Param, Delete, HttpCode, HttpStatus, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { CustodyEventsService } from './custody-events.service';
import { CreateCustodyEventDto } from './dto/create-custody-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('custody-events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustodyEventsController {
  constructor(private readonly custodyEventsService: CustodyEventsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVESTIGATOR)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCustodyEventDto: CreateCustodyEventDto) {
    return this.custodyEventsService.create(createCustodyEventDto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVESTIGATOR, Role.AUDITOR)
  async findAll() {
    return this.custodyEventsService.findAll();
  }

  @Get('evidence/:evidenceId')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVESTIGATOR, Role.AUDITOR)
  async findByEvidenceId(@Param('evidenceId', ParseUUIDPipe) evidenceId: string) {
    return this.custodyEventsService.findByEvidenceId(evidenceId);
  }

  @Post('evidence/:evidenceId/handover/dispatch')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVESTIGATOR)
  async dispatchHandover(
    @Param('evidenceId', ParseUUIDPipe) evidenceId: string,
    @Body('recipientId', ParseUUIDPipe) recipientId: string,
    @Body('location') location: string,
    @CurrentUser() user: { id: string }
  ) {
    return this.custodyEventsService.dispatchHandover(evidenceId, recipientId, location, user.id);
  }

  @Post('evidence/:evidenceId/handover/accept')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVESTIGATOR)
  async acceptHandover(
    @Param('evidenceId', ParseUUIDPipe) evidenceId: string,
    @Body('location') location: string,
    @CurrentUser() user: { id: string }
  ) {
    return this.custodyEventsService.acceptHandover(evidenceId, location, user.id);
  }

  @Post('evidence/:evidenceId/handover/reject')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVESTIGATOR)
  async rejectHandover(
    @Param('evidenceId', ParseUUIDPipe) evidenceId: string,
    @CurrentUser() user: { id: string }
  ) {
    return this.custodyEventsService.rejectHandover(evidenceId, user.id);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVESTIGATOR, Role.AUDITOR)
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.custodyEventsService.findById(id);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.custodyEventsService.delete(id);
  }
}
