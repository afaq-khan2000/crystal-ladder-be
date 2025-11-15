import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional } from 'class-validator';

export class ApproveAppointmentDto {
  @ApiProperty({
    description: 'Therapist ID to assign (optional)',
    required: false,
    example: 1,
  })
  @IsInt()
  @IsOptional()
  therapistId?: number;
}

