import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, ParseUUIDPipe, UseGuards, Query, UseInterceptors, UploadedFile, BadRequestException, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { EvidencesService } from './evidences.service';
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import { UpdateEvidenceDto } from './dto/update-evidence.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('evidences')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EvidencesController {
  constructor(private readonly evidencesService: EvidencesService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVESTIGATOR)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = join(process.cwd(), 'uploads/evidences');
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + extname(file.originalname));
      }
    }),
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|pdf|mp4)$/i)) {
        return cb(new BadRequestException('Only jpg, png, pdf, and mp4 files are allowed!'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 50 * 1024 * 1024 // 50MB
    }
  }))
  async create(
    @Body() createEvidenceDto: CreateEvidenceDto,
    @CurrentUser() user: { id: string },
    @UploadedFile() file?: Express.Multer.File
  ) {
    return this.evidencesService.create(createEvidenceDto, user.id, file);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVESTIGATOR, Role.AUDITOR, Role.OFFICER)
  async findAll(@Query('caseId') caseId?: string) {
    return this.evidencesService.findAll(caseId);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVESTIGATOR, Role.AUDITOR, Role.OFFICER)
  async findById(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: { id: string }, @Req() req: any) {
    return this.evidencesService.findByIdWithAudit(id, user.id, req.ip);
  }

  @Get(':id/verify-hash')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVESTIGATOR, Role.AUDITOR, Role.OFFICER)
  async verifyHash(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: { id: string }) {
    return this.evidencesService.verifyHash(id, user.id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVESTIGATOR, Role.AUDITOR)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEvidenceDto: UpdateEvidenceDto,
    @CurrentUser() user: { id: string; role?: { name: string } }
  ) {
    return this.evidencesService.update(id, updateEvidenceDto, user.id, user.role?.name);
  }

  @Get(':id/approvals/pending')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVESTIGATOR)
  async getPendingApprovals(@Param('id', ParseUUIDPipe) id: string) {
    return this.evidencesService.getPendingApprovals(id);
  }

  @Post(':id/approvals/:approvalId/approve')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async approveEdit(
    @Param('approvalId', ParseUUIDPipe) approvalId: string,
    @CurrentUser() user: { id: string }
  ) {
    return this.evidencesService.approveEdit(approvalId, user.id);
  }

  @Post(':id/approvals/:approvalId/reject')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async rejectEdit(
    @Param('approvalId', ParseUUIDPipe) approvalId: string,
    @CurrentUser() user: { id: string }
  ) {
    return this.evidencesService.rejectEdit(approvalId, user.id);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string }
  ) {
    return this.evidencesService.delete(id, user.id);
  }
}
