import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UserModule } from '../user/user.module';
import { ChildrenModule } from '../children/children.module';
import { ServicesModule } from '../services/services.module';
import { EventsModule } from '../events/events.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { ReportsModule } from '../reports/reports.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { MessagesModule } from '../messages/messages.module';
import { FaqsModule } from '../faqs/faqs.module';

@Module({
  imports: [
    MulterModule.register({}),
    UserModule,
    ChildrenModule,
    ServicesModule,
    EventsModule,
    AppointmentsModule,
    ReportsModule,
    DashboardModule,
    AuditLogsModule,
    MessagesModule,
    FaqsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}

