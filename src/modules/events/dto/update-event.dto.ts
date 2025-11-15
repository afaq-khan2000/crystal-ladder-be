import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateEventDto } from './create-event.dto';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateEventDto extends PartialType(CreateEventDto) {
  @ApiPropertyOptional({
    description: 'Existing image URLs to retain when updating an event',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  existingImages?: string[];
}

