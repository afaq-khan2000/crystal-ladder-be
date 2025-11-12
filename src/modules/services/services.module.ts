import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesService } from './services.service';
import { Service } from '@/entities/service.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Service])],
  controllers: [],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}

