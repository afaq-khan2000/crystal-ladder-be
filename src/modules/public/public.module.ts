import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicService } from './public.service';
import { PublicController } from './public.controller';
import { Service } from '@/entities/service.entity';
import { Event } from '@/entities/event.entity';
import { AppointmentsModule } from '../appointments/appointments.module';
import { FaqsModule } from '../faqs/faqs.module';

@Module({
  imports: [TypeOrmModule.forFeature([Service, Event]), AppointmentsModule, FaqsModule],
  controllers: [PublicController],
  providers: [PublicService],
  exports: [PublicService],
})
export class PublicModule {}

