import { PartialType } from '@nestjs/swagger';
import { CreateAppointmentDto } from './create-appointment.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AppointmentStatus } from '@/entities/appointment.entity';

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {
  @ApiProperty({
    description: 'Appointment status',
    enum: AppointmentStatus,
    required: false,
  })
  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;

  @ApiProperty({
    description: 'Cancellation reason (if cancelled)',
    required: false,
  })
  @IsString()
  @IsOptional()
  cancellationReason?: string;
}

