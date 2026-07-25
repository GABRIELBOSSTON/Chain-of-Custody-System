import { Module } from '@nestjs/common';
import { CustodyEventsService } from './custody-events.service';
import { CustodyEventsController } from './custody-events.controller';

@Module({
  providers: [CustodyEventsService],
  controllers: [CustodyEventsController],
  exports: [CustodyEventsService],
})
export class CustodyEventsModule {}
