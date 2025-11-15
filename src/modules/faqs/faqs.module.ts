import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Faq } from '@/entities/faq.entity';
import { FaqsService } from './faqs.service';

@Module({
  imports: [TypeOrmModule.forFeature([Faq])],
  providers: [FaqsService],
  exports: [FaqsService],
})
export class FaqsModule {}


