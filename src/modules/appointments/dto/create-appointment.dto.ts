import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsDateString,
} from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({
    description: 'Appointment date and time',
    example: '2024-02-15T10:00:00Z',
  })
  @IsDateString()
  appointmentDate: Date;

  @ApiProperty({
    description: 'Child ID',
    example: 1,
  })
  @IsInt()
  childId: number;

  @ApiProperty({
    description: 'Service ID',
    example: 1,
  })
  @IsInt()
  serviceId: number;

  @ApiProperty({
    description: 'Therapist ID (optional, can be assigned by admin)',
    required: false,
  })
  @IsInt()
  @IsOptional()
  therapistId?: number;

  @ApiProperty({
    description: 'Additional notes',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

