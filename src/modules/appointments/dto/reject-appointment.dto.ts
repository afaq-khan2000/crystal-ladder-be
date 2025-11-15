import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class RejectAppointmentDto {
  @ApiProperty({
    description: 'Rejection reason (optional)',
    required: false,
    example: 'No available slots at requested time',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

