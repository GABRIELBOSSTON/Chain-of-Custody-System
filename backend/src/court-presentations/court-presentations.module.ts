import { Module } from '@nestjs/common';
import { CourtPresentationsService } from './court-presentations.service';
import { CourtPresentationsController } from './court-presentations.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CustodyEventsModule } from '../custody-events/custody-events.module';

@Module({
  imports: [PrismaModule, CustodyEventsModule],
  controllers: [CourtPresentationsController],
  providers: [CourtPresentationsService],
  exports: [CourtPresentationsService],
})
export class CourtPresentationsModule {}
