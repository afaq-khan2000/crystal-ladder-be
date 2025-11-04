import { PartialType } from '@nestjs/swagger';
import { CreateMessageDto } from './create-message.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateMessageDto extends PartialType(CreateMessageDto) {
  @ApiProperty({
    description: 'Mark message as read',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isRead?: boolean;
}

