import { Module } from '@nestjs/common';
import { EscalationsService } from './escalations.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [EscalationsService],
})
export class EscalationsModule {}
