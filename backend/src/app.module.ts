import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CasesModule } from './cases/cases.module';
import { EvidenceModule } from './evidence/evidence.module';
import { CustodyEventsModule } from './custody-events/custody-events.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { ReportsModule } from './reports/reports.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CasesModule,
    EvidenceModule,
    CustodyEventsModule,
    AuditLogsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }