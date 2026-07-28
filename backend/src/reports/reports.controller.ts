import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.AUDITOR) // Applied globally to all endpoints
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  async getSummary(@CurrentUser() user: { id: string; role?: { name: string } }) {
    return this.reportsService.getSummary(user);
  }

  @Get('cases')
  async getActiveCases(
    @CurrentUser() user: { id: string; role?: { name: string } },
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.reportsService.getActiveCases(user, startDate, endDate);
  }

  @Get('evidence')
  async getActiveEvidence(
    @CurrentUser() user: { id: string; role?: { name: string } },
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('caseId') caseId?: string
  ) {
    return this.reportsService.getActiveEvidence(user, startDate, endDate, caseId);
  }

  @Get('custody-events')
  async getCustodyEvents(
    @CurrentUser() user: { id: string; role?: { name: string } },
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('caseId') caseId?: string,
    @Query('evidenceId') evidenceId?: string
  ) {
    return this.reportsService.getCustodyEvents(user, startDate, endDate, caseId, evidenceId);
  }

  @Get('audit-logs')
  async getAuditLogs(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.reportsService.getAuditLogs(startDate, endDate);
  }
}
