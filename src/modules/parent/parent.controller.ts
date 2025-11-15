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
  Put,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ParentService } from './parent.service';
import { JwtAuthGuard } from '../auth/guards/local-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/common/enums/roles.enum';
import { ApiSecurityAuth } from '@/common/decorators/swagger.decorator';
import { CreateChildDto } from '../children/dto/create-child.dto';
import { UpdateChildDto } from '../children/dto/update-child.dto';
import { CreateAppointmentDto } from '../appointments/dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../appointments/dto/update-appointment.dto';
import { AppointmentStatus } from '@/entities/appointment.entity';
import { CreateMessageDto } from '../messages/dto/create-message.dto';
import { UpdateMessageDto } from '../messages/dto/update-message.dto';
import { MessageType } from '@/entities/message.entity';

@Controller('parent')
@ApiTags('parent')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Parent)
@ApiSecurityAuth()
@ApiBearerAuth()
export class ParentController {
  constructor(private readonly parentService: ParentService) {}

  // ==================== Dashboard ====================
  @Get('dashboard')
  @ApiOperation({ summary: 'Get parent dashboard data with stats' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  getDashboard(@Request() req: any) {
    return this.parentService.getDashboard(req.user.id);
  }

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get parent dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getStats(@Request() req: any) {
    return this.parentService.getStats(req.user.id);
  }

  // ==================== Children Management ====================
  @Get('children')
  @ApiOperation({ summary: 'Get all children for the parent' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'List of children' })
  getChildren(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    return this.parentService.getChildren(req.user.id, pageNum, limitNum);
  }

  @Get('children/:id')
  @ApiOperation({ summary: 'Get a child by ID' })
  @ApiResponse({ status: 200, description: 'Child details' })
  @ApiResponse({ status: 404, description: 'Child not found' })
  getChild(@Param('id') id: string, @Request() req: any) {
    return this.parentService.getChild(parseInt(id), req.user.id);
  }

  @Post('children')
  @ApiOperation({ summary: 'Create a new child' })
  @ApiResponse({ status: 201, description: 'Child created successfully' })
  createChild(@Body() createChildDto: CreateChildDto, @Request() req: any) {
    return this.parentService.createChild(createChildDto, req.user.id);
  }

  @Patch('children/:id')
  @ApiOperation({ summary: 'Update a child' })
  @ApiResponse({ status: 200, description: 'Child updated successfully' })
  @ApiResponse({ status: 404, description: 'Child not found' })
  updateChild(
    @Param('id') id: string,
    @Body() updateChildDto: UpdateChildDto,
    @Request() req: any,
  ) {
    return this.parentService.updateChild(parseInt(id), updateChildDto, req.user.id);
  }

  @Delete('children/:id')
  @ApiOperation({ summary: 'Delete a child' })
  @ApiResponse({ status: 200, description: 'Child deleted successfully' })
  @ApiResponse({ status: 404, description: 'Child not found' })
  @ApiResponse({ status: 403, description: 'Unauthorized access' })
  async deleteChild(@Param('id') id: string, @Request() req: any) {
    if (!req.user || !req.user.id) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }
    await this.parentService.deleteChild(parseInt(id), req.user.id);
    return { message: 'Child deleted successfully' };
  }

  // ==================== Appointments Management ====================
  @Get('appointments')
  @ApiOperation({ summary: 'Get all appointments for the parent' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: AppointmentStatus,
  })
  @ApiQuery({ name: 'childId', required: false, type: Number })
  @ApiQuery({ name: 'serviceId', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of appointments' })
  getAppointments(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: AppointmentStatus,
    @Query('childId') childId?: string,
    @Query('serviceId') serviceId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    return this.parentService.getAppointments(
      req.user.id,
      pageNum,
      limitNum,
      status,
      childId ? parseInt(childId) : undefined,
      serviceId ? parseInt(serviceId) : undefined,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('appointments/:id')
  @ApiOperation({ summary: 'Get an appointment by ID' })
  @ApiResponse({ status: 200, description: 'Appointment details' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  getAppointment(@Param('id') id: string, @Request() req: any) {
    return this.parentService.getAppointment(parseInt(id), req.user.id);
  }

  @Post('appointments')
  @ApiOperation({ summary: 'Book a new appointment' })
  @ApiResponse({ status: 201, description: 'Appointment created successfully' })
  createAppointment(@Body() createAppointmentDto: CreateAppointmentDto, @Request() req: any) {
    return this.parentService.createAppointment(createAppointmentDto, req.user.id);
  }

  @Patch('appointments/:id')
  @ApiOperation({ summary: 'Update an appointment' })
  @ApiResponse({ status: 200, description: 'Appointment updated successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  updateAppointment(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
    @Request() req: any,
  ) {
    return this.parentService.updateAppointment(
      parseInt(id),
      updateAppointmentDto,
      req.user.id,
    );
  }

  @Delete('appointments/:id')
  @ApiOperation({ summary: 'Cancel an appointment' })
  @ApiResponse({ status: 200, description: 'Appointment cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  cancelAppointment(@Param('id') id: string, @Request() req: any) {
    return this.parentService.cancelAppointment(parseInt(id), req.user.id);
  }

  // ==================== Progress Reports ====================
  @Get('progress')
  @ApiOperation({ summary: 'Get child progress reports' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'childId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of progress reports' })
  getProgress(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('childId') childId?: string,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const childIdNum = childId ? parseInt(childId) : undefined;
    return this.parentService.getProgress(req.user.id, pageNum, limitNum, childIdNum);
  }

  @Get('progress/:id')
  @ApiOperation({ summary: 'Get a progress report by ID' })
  @ApiResponse({ status: 200, description: 'Progress report details' })
  @ApiResponse({ status: 404, description: 'Progress report not found' })
  getProgressReport(@Param('id') id: string, @Request() req: any) {
    return this.parentService.getProgressReport(parseInt(id), req.user.id);
  }

  @Get('progress/child/:childId')
  @ApiOperation({ summary: 'Get all progress reports for a specific child' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'List of progress reports for the child' })
  getChildProgress(
    @Param('childId') childId: string,
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    return this.parentService.getChildProgress(
      req.user.id,
      parseInt(childId),
      pageNum,
      limitNum,
    );
  }

  // ==================== Messages Management ====================
  @Get('messages')
  @ApiOperation({ summary: 'Get all messages for the parent' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: MessageType,
  })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of messages' })
  getMessages(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: MessageType,
    @Query('isRead') isRead?: string,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const isReadFilter =
      isRead === 'true' ? true : isRead === 'false' ? false : undefined;
    return this.parentService.getMessages(
      req.user.id,
      pageNum,
      limitNum,
      type,
      isReadFilter,
    );
  }

  @Get('messages/:id')
  @ApiOperation({ summary: 'Get a message by ID' })
  @ApiResponse({ status: 200, description: 'Message details' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  getMessage(@Param('id') id: string, @Request() req: any) {
    return this.parentService.getMessage(parseInt(id), req.user.id);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Create a new message' })
  @ApiResponse({ status: 201, description: 'Message created successfully' })
  createMessage(@Body() createMessageDto: CreateMessageDto, @Request() req: any) {
    return this.parentService.createMessage(createMessageDto, req.user.id);
  }

  @Patch('messages/:id')
  @ApiOperation({ summary: 'Update a message' })
  @ApiResponse({ status: 200, description: 'Message updated successfully' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  updateMessage(
    @Param('id') id: string,
    @Body() updateMessageDto: UpdateMessageDto,
    @Request() req: any,
  ) {
    return this.parentService.updateMessage(parseInt(id), updateMessageDto, req.user.id);
  }

  @Put('messages/:id/read')
  @ApiOperation({ summary: 'Mark message as read' })
  @ApiResponse({ status: 200, description: 'Message marked as read' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  markMessageAsRead(@Param('id') id: string, @Request() req: any) {
    return this.parentService.markMessageAsRead(parseInt(id), req.user.id);
  }

  @Delete('messages/:id')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiResponse({ status: 200, description: 'Message deleted successfully' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  deleteMessage(@Param('id') id: string, @Request() req: any) {
    return this.parentService.deleteMessage(parseInt(id), req.user.id);
  }
}

