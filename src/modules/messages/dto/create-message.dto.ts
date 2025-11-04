import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsArray,
  MinLength,
  MaxLength,
} from 'class-validator';
import { MessageType } from '@/entities/message.entity';

export class CreateMessageDto {
  @ApiProperty({ description: 'Message subject', example: 'Appointment Reminder' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  subject: string;

  @ApiProperty({ description: 'Message content' })
  @IsString()
  content: string;

  @ApiProperty({
    description: 'Message type',
    enum: MessageType,
    default: MessageType.Direct,
  })
  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType;

  @ApiProperty({
    description: 'Receiver ID (optional for announcements/newsletters)',
    required: false,
  })
  @IsInt()
  @IsOptional()
  receiverId?: number;

  @ApiProperty({
    description: 'Attachment URLs array',
    required: false,
    type: [String],
  })
  @IsArray()
  @IsOptional()
  attachments?: string[];
}

