import { Controller, Get, UseGuards, Query } from '@nestjs/common';
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
  async getActiveCases(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.reportsService.getActiveCases(startDate, endDate);
  }

  @Get('evidence')
  async getActiveEvidence(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('caseId') caseId?: string
  ) {
    return this.reportsService.getActiveEvidence(startDate, endDate, caseId);
  }

  @Get('custody-events')
  async getCustodyEvents(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('caseId') caseId?: string,
    @Query('evidenceId') evidenceId?: string
  ) {
    return this.reportsService.getCustodyEvents(startDate, endDate, caseId, evidenceId);
  }

  @Get('audit-logs')
  async getAuditLogs(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.reportsService.getAuditLogs(startDate, endDate);
  }
}
