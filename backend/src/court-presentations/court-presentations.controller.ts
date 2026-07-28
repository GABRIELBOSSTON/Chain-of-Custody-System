import { Controller, Post, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { CourtPresentationsService } from './court-presentations.service';
import { CreateCourtPresentationDto } from './dto/create-court-presentation.dto';
import { ReturnCourtPresentationDto } from './dto/return-court-presentation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('court-presentations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CourtPresentationsController {
  constructor(private readonly courtPresentationsService: CourtPresentationsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVESTIGATOR)
  async create(
    @Body() createDto: CreateCourtPresentationDto,
    @CurrentUser() user: { id: string }
  ) {
    return this.courtPresentationsService.create(createDto, user.id);
  }

  @Post(':id/return')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVESTIGATOR)
  async returnEvidence(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() returnDto: ReturnCourtPresentationDto,
    @CurrentUser() user: { id: string }
  ) {
    return this.courtPresentationsService.returnEvidence(id, returnDto, user.id);
  }
}
