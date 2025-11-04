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
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/local-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/common/enums/roles.enum';
import { ApiSecurityAuth } from '@/common/decorators/swagger.decorator';
import { AppointmentStatus } from '@/entities/appointment.entity';

@Controller('appointments')
@ApiTags('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiSecurityAuth()
@ApiBearerAuth()
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  /**
   * Create a new appointment
   * Parents can book appointments for their children
   */
  @Post()
  @Roles(Role.Parent, Role.Admin)
  @ApiOperation({ summary: 'Create a new appointment' })
  @ApiResponse({ status: 201, description: 'Appointment created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() createAppointmentDto: CreateAppointmentDto, @Request() req) {
    return this.appointmentsService.create(createAppointmentDto, req.user.id);
  }

  /**
   * Get all appointments (paginated)
   * Filtered by user role
   */
  @Get()
  @ApiOperation({ summary: 'Get all appointments (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: AppointmentStatus,
  })
  @ApiResponse({ status: 200, description: 'List of appointments' })
  findAll(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: AppointmentStatus,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    return this.appointmentsService.findAll(
      pageNum,
      limitNum,
      status,
      req.user.id,
      req.user.role,
    );
  }

  /**
   * Get a specific appointment by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get an appointment by ID' })
  @ApiResponse({ status: 200, description: 'Appointment details' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.appointmentsService.findOne(
      parseInt(id),
      req.user.id,
      req.user.role,
    );
  }

  /**
   * Update an appointment (approve/reject/reschedule)
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update an appointment' })
  @ApiResponse({ status: 200, description: 'Appointment updated successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
    @Request() req,
  ) {
    return this.appointmentsService.update(
      parseInt(id),
      updateAppointmentDto,
      req.user.id,
      req.user.role,
    );
  }

  /**
   * Delete/cancel an appointment
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete/cancel an appointment' })
  @ApiResponse({ status: 200, description: 'Appointment deleted/cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Param('id') id: string, @Request() req) {
    return this.appointmentsService.remove(
      parseInt(id),
      req.user.id,
      req.user.role,
    );
  }
}

