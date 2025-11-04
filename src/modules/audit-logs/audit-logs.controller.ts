import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../auth/guards/local-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/common/enums/roles.enum';
import { ApiSecurityAuth } from '@/common/decorators/swagger.decorator';
import { AuditAction } from '@/entities/audit-log.entity';

@Controller('audit-logs')
@ApiTags('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiSecurityAuth()
@ApiBearerAuth()
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  /**
   * Get all audit logs (paginated)
   * Admin only
   */
  @Get()
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Get all audit logs (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({
    name: 'action',
    required: false,
    enum: AuditAction,
  })
  @ApiQuery({ name: 'entity', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of audit logs' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('userId') userId?: string,
    @Query('action') action?: AuditAction,
    @Query('entity') entity?: string,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const userIdNum = userId ? parseInt(userId) : undefined;

    return this.auditLogsService.findAll(
      pageNum,
      limitNum,
      userIdNum,
      action,
      entity,
    );
  }

  /**
   * Get a specific audit log by ID
   * Admin only
   */
  @Get(':id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Get an audit log by ID' })
  @ApiResponse({ status: 200, description: 'Audit log details' })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findOne(@Param('id') id: string) {
    return this.auditLogsService.findOne(parseInt(id));
  }
}

