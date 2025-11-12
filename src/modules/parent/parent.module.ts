import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParentService } from './parent.service';
import { ParentController } from './parent.controller';
import { ChildrenModule } from '../children/children.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { ReportsModule } from '../reports/reports.module';
import { MessagesModule } from '../messages/messages.module';
import { Appointment } from '@/entities/appointment.entity';
import { Child } from '@/entities/child.entity';
import { Report } from '@/entities/report.entity';
import { User } from '@/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, Child, Report, User]),
    ChildrenModule,
    AppointmentsModule,
    ReportsModule,
    MessagesModule,
  ],
  controllers: [ParentController],
  providers: [ParentService],
  exports: [ParentService],
})
export class ParentModule {}

