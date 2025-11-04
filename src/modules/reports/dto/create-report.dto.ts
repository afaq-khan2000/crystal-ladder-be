import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsObject,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ReportType } from '@/entities/report.entity';

export class CreateReportDto {
  @ApiProperty({ description: 'Report title', example: 'Progress Report - January 2024' })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: 'Report content' })
  @IsString()
  content: string;

  @ApiProperty({
    description: 'Report type',
    enum: ReportType,
    default: ReportType.General,
  })
  @IsEnum(ReportType)
  @IsOptional()
  type?: ReportType;

  @ApiProperty({
    description: 'Metrics/chart data (JSON object)',
    required: false,
  })
  @IsObject()
  @IsOptional()
  metrics?: Record<string, unknown>;

  @ApiProperty({
    description: 'Attachment URLs array',
    required: false,
    type: [String],
  })
  @IsOptional()
  attachments?: string[];

  @ApiProperty({ description: 'Child ID', example: 1 })
  @IsInt()
  childId: number;
}

