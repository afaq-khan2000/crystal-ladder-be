import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateFaqDto {
  @ApiProperty({ description: 'FAQ title', example: 'How do I book a session?' })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  title: string;

  @ApiProperty({
    description: 'FAQ description or answer',
    example: 'You can request a session through the appointments page.',
  })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Publish status', required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}


