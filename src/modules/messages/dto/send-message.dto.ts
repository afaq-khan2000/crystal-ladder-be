import { IsString, IsNotEmpty, IsOptional, IsArray, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ description: 'Message content' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: 'Receiver ID (for admin sending to user)' })
  @IsNumber()
  @IsOptional()
  receiverId?: number;

  @ApiPropertyOptional({ description: 'Attachments array', type: [String] })
  @IsArray()
  @IsOptional()
  attachments?: string[];
}

