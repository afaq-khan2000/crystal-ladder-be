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
import { EventType } from '@/entities/event.entity';

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
    enum: EventType,
    default: EventType.Announcement,
  })
  @IsString()
  @IsOptional()
  type?: EventType;

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
  isPublished?: boolean;

  @ApiProperty({
    description: 'Is event featured',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;
}

