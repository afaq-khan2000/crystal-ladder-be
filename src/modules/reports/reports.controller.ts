import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { JwtAuthGuard } from '../auth/guards/local-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/common/enums/roles.enum';
import { ApiSecurityAuth } from '@/common/decorators/swagger.decorator';

@Controller('reports')
@ApiTags('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiSecurityAuth()
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * Create a new report
   * Therapists can create reports for children
   */
  @Post()
  @Roles(Role.Therapist, Role.Admin)
  @ApiOperation({ summary: 'Create a new report' })
  @ApiResponse({ status: 201, description: 'Report created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() createReportDto: CreateReportDto, @Request() req) {
    return this.reportsService.create(createReportDto, req.user.id);
  }

  /**
   * Get all reports (paginated)
   * Filtered by user role
   */
  @Get()
  @ApiOperation({ summary: 'Get all reports (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'childId', required: false, type: Number })
  @ApiQuery({ name: 'therapistId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of reports' })
  findAll(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('childId') childId?: string,
    @Query('therapistId') therapistId?: string,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const childIdNum = childId ? parseInt(childId) : undefined;
    const therapistIdNum = therapistId ? parseInt(therapistId) : undefined;

    return this.reportsService.findAll(
      pageNum,
      limitNum,
      childIdNum,
      therapistIdNum,
      req.user.id,
      req.user.role,
    );
  }

  /**
   * Get a specific report by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a report by ID' })
  @ApiResponse({ status: 200, description: 'Report details' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.reportsService.findOne(
      parseInt(id),
      req.user.id,
      req.user.role,
    );
  }

  /**
   * Update a report
   */
  @Patch(':id')
  @Roles(Role.Therapist, Role.Admin)
  @ApiOperation({ summary: 'Update a report' })
  @ApiResponse({ status: 200, description: 'Report updated successfully' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(
    @Param('id') id: string,
    @Body() updateReportDto: UpdateReportDto,
    @Request() req,
  ) {
    return this.reportsService.update(
      parseInt(id),
      updateReportDto,
      req.user.id,
      req.user.role,
    );
  }

  /**
   * Delete a report (soft delete)
   * Admin only
   */
  @Delete(':id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Delete a report' })
  @ApiResponse({ status: 200, description: 'Report deleted successfully' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Param('id') id: string, @Request() req) {
    return this.reportsService.remove(
      parseInt(id),
      req.user.id,
      req.user.role,
    );
  }
}

