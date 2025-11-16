import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { ChatGateway } from './chat.gateway';
import { Message } from '@/entities/message.entity';
import { User } from '@/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Message, User])],
  controllers: [MessagesController],
  providers: [MessagesService, ChatGateway],
  exports: [MessagesService, ChatGateway],
})
export class MessagesModule {}

