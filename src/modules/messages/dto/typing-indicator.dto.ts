import { IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TypingIndicatorDto {
  @ApiProperty({ description: 'Is typing status' })
  @IsBoolean()
  isTyping: boolean;

  @ApiPropertyOptional({ description: 'Receiver ID (for admin)' })
  @IsNumber()
  @IsOptional()
  receiverId?: number;
}

