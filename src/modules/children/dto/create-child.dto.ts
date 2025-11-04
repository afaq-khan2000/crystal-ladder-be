import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateChildDto {
  @ApiProperty({ description: 'First name of the child', example: 'John' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ description: 'Last name of the child', example: 'Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName: string;

  @ApiProperty({
    description: 'Date of birth',
    example: '2020-01-15',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: Date;

  @ApiProperty({
    description: 'Gender',
    example: 'male',
    required: false,
  })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiProperty({
    description: 'Diagnosis information',
    required: false,
  })
  @IsString()
  @IsOptional()
  diagnosis?: string;

  @ApiProperty({
    description: 'Additional notes',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'Profile image URL',
    required: false,
  })
  @IsString()
  @IsOptional()
  profileImage?: string;

  @ApiProperty({
    description: 'Therapist ID (optional, can be assigned later)',
    required: false,
  })
  @IsInt()
  @IsOptional()
  therapistId?: number;
}

