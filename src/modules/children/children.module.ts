import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChildrenService } from './children.service';
import { Child } from '@/entities/child.entity';
import { User } from '@/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Child, User])],
  controllers: [],
  providers: [ChildrenService],
  exports: [ChildrenService],
})
export class ChildrenModule {}

