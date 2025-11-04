import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ description: 'Service name', example: 'Speech Therapy' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @ApiProperty({
    description: 'Service description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Service price',
    example: 100.0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @ApiProperty({
    description: 'Duration in minutes',
    example: 60,
    default: 60,
  })
  @IsNumber()
  @IsOptional()
  @Min(15)
  @Max(480)
  duration?: number;

  @ApiProperty({
    description: 'Is service active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

