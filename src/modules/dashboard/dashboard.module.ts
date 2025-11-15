import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { Appointment } from '@/entities/appointment.entity';
import { User } from '@/entities/user.entity';
import { Child } from '@/entities/child.entity';
import { Service } from '@/entities/service.entity';
import { Report } from '@/entities/report.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, User, Child, Service, Report]),
  ],
  controllers: [],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}

