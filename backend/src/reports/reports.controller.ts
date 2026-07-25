import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.AUDITOR) // Applied globally to all endpoints
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  async getSummary() {
    return this.reportsService.getSummary();
  }

  @Get('cases')
  async getActiveCases() {
    return this.reportsService.getActiveCases();
  }

  @Get('evidence')
  async getActiveEvidence() {
    return this.reportsService.getActiveEvidence();
  }

  @Get('custody-events')
  async getCustodyEvents() {
    return this.reportsService.getCustodyEvents();
  }
}
