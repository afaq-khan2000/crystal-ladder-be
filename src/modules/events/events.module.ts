import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { Event } from '@/entities/event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Event])],
  controllers: [],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}

