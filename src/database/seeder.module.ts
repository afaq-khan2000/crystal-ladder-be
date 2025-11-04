import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeder.service';
import { User } from '@/entities/user.entity';
import { Child } from '@/entities/child.entity';
import { Service } from '@/entities/service.entity';
import { Appointment } from '@/entities/appointment.entity';
import { Report } from '@/entities/report.entity';
import { Message } from '@/entities/message.entity';
import { Event } from '@/entities/event.entity';
import { AuditLog } from '@/entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Child,
      Service,
      Appointment,
      Report,
      Message,
      Event,
      AuditLog,
    ]),
  ],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}

