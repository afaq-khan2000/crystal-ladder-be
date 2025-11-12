import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsInt,
  IsDateString,
  IsOptional,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';

export enum UrgencyLevel {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Urgent = 'urgent',
}

export enum AgeRange {
  Infant = '0-2',
  Toddler = '3-5',
  SchoolAge = '6-12',
  Teen = '13-17',
  YoungAdult = '18+',
}

export class BookAppointmentDto {
  @ApiProperty({
    description: 'Service ID',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  serviceId: number;

  @ApiProperty({
    description: 'Appointment date and time',
    example: '2024-02-15T10:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  appointmentDate: string;

  @ApiProperty({
    description: 'Full name of the parent/guardian',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    description: 'Email address of the parent/guardian',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Phone number',
    example: '(555) 123-4567',
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({
    description: "Child's name",
    example: 'Jane Doe',
  })
  @IsString()
  @IsNotEmpty()
  childName: string;

  @ApiProperty({
    description: 'Date of birth',
    example: '2024-02-15',
  })
  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string;


  @ApiProperty({
    description: 'Gender',
    example: 'male',
  })
  @IsString()
  @IsNotEmpty()
  gender: string;
  
  @ApiProperty({
    description: 'Preferred location',
    example: 'Main Office',
  })
  @IsString()
  @IsNotEmpty()
  preferredLocation: string;

  @ApiProperty({
    description: 'Urgency level',
    enum: UrgencyLevel,
    example: UrgencyLevel.Medium,
  })
  @IsEnum(UrgencyLevel)
  @IsNotEmpty()
  urgencyLevel: UrgencyLevel;

  @ApiProperty({
    description: 'Additional notes or concerns',
    required: false,
    example: 'Child has specific dietary requirements',
  })
  @IsString()
  @IsOptional()
  additionalNotes?: string;
}
