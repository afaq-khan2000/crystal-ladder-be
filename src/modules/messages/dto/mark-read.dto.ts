import { IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MarkReadDto {
  @ApiProperty({ description: 'Message ID to mark as read' })
  @IsNumber()
  @IsNotEmpty()
  messageId: number;
}

