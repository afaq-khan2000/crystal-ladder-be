import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { Report } from '@/entities/report.entity';
import { User } from '@/entities/user.entity';
import { Child } from '@/entities/child.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Report, User, Child])],
  controllers: [],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}

