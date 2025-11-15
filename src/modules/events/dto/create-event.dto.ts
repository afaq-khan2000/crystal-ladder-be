import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsArray,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

const toBoolean = (value: any) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }

  return value;
};

export class CreateEventDto {
  @ApiProperty({ description: 'Event title', example: 'Parent Workshop - Communication Strategies' })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: 'Event description' })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Event type',
    example: 'announcement',
    required: false,
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({
    description: 'Event start date and time',
    example: '2024-02-15T10:00:00Z',
  })
  @IsDateString()
  eventDate: Date;

  @ApiProperty({
    description: 'Event end date and time',
    example: '2024-02-15T12:00:00Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  eventEndDate?: Date;

  @ApiProperty({
    description: 'Event location',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  location?: string;

  @ApiProperty({
    description: 'Image URLs array',
    required: false,
    type: [String],
  })
  @IsArray()
  @IsOptional()
  images?: string[];

  @ApiProperty({
    description: 'Is event published',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  isPublished?: boolean;

  @ApiProperty({
    description: 'Is event featured',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  isFeatured?: boolean;
}

