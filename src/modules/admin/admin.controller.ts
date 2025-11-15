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
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/local-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/common/enums/roles.enum';
import { ApiSecurityAuth } from '@/common/decorators/swagger.decorator';
import { CreateServiceDto } from '../services/dto/create-service.dto';
import { UpdateServiceDto } from '../services/dto/update-service.dto';
import { CreateEventDto } from '../events/dto/create-event.dto';
import { UpdateEventDto } from '../events/dto/update-event.dto';
import { UpdateUserDto } from '../user/dto/update-user.dto';
import { CreateChildDto } from '../children/dto/create-child.dto';
import { CreateChildAdminDto } from './dto/create-child-admin.dto';
import { UpdateChildDto } from '../children/dto/update-child.dto';
import { CreateReportDto } from '../reports/dto/create-report.dto';
import { UpdateReportDto } from '../reports/dto/update-report.dto';
import { ApproveAppointmentDto } from '../appointments/dto/approve-appointment.dto';
import { RejectAppointmentDto } from '../appointments/dto/reject-appointment.dto';
import { UpdateAppointmentDto } from '../appointments/dto/update-appointment.dto';
import { AppointmentStatus } from '@/entities/appointment.entity';
import { AuditAction } from '@/entities/audit-log.entity';
import { CreateMessageDto } from '../messages/dto/create-message.dto';
import { UpdateMessageDto } from '../messages/dto/update-message.dto';
import { MessageType } from '@/entities/message.entity';
import { CreateFaqDto } from '../faqs/dto/create-faq.dto';
import { UpdateFaqDto } from '../faqs/dto/update-faq.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { eventImagesMulterOptions } from '@/common/config/upload.config';
import { Express } from 'express';

@Controller('admin')
@ApiTags('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@ApiSecurityAuth()
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==================== Dashboard ====================
  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard data' })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Number of days for graph data (default: 30)',
    example: 30,
  })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  getDashboard(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days) : 30;
    return this.adminService.getDashboard(daysNum);
  }

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getStats() {
    return this.adminService.getStats();
  }

  // ==================== Users Management ====================
  @Get('users')
  @ApiOperation({ summary: 'Get all users/parents (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'role', required: false, enum: Role })
  @ApiQuery({ name: 'isApproved', required: false, type: Boolean })
  @ApiQuery({ name: 'isEmailVerified', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of users' })
  getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('role') role?: Role,
    @Query('isApproved') isApproved?: string,
    @Query('isEmailVerified') isEmailVerified?: string,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const isApprovedBool =
      isApproved === 'true' ? true : isApproved === 'false' ? false : undefined;
    const isEmailVerifiedBool =
      isEmailVerified === 'true'
        ? true
        : isEmailVerified === 'false'
          ? false
          : undefined;

    return this.adminService.getUsers(
      pageNum,
      limitNum,
      role,
      isApprovedBool,
      isEmailVerifiedBool,
    );
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getUser(@Param('id') id: string) {
    return this.adminService.getUser(parseInt(id));
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.adminService.updateUser(parseInt(id), updateUserDto);
  }

  @Post('users/:id/approve')
  @ApiOperation({ summary: 'Approve a user' })
  @ApiResponse({ status: 200, description: 'User approved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  approveUser(@Param('id') id: string) {
    return this.adminService.approveUser(parseInt(id));
  }

  @Post('users/:id/unapprove')
  @ApiOperation({ summary: 'Unapprove a user' })
  @ApiResponse({ status: 200, description: 'User unapproved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  unapproveUser(@Param('id') id: string) {
    return this.adminService.unapproveUser(parseInt(id));
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  // ==================== Children Management ====================
  @Get('children')
  @ApiOperation({ summary: 'Get all children (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'List of children' })
  getChildren(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    return this.adminService.getChildren(pageNum, limitNum);
  }

  @Get('children/:id')
  @ApiOperation({ summary: 'Get a child by ID' })
  @ApiResponse({ status: 200, description: 'Child details' })
  @ApiResponse({ status: 404, description: 'Child not found' })
  getChild(@Param('id') id: string) {
    return this.adminService.getChild(parseInt(id));
  }

  @Post('children')
  @ApiOperation({ summary: 'Create a new child' })
  @ApiResponse({ status: 201, description: 'Child created successfully' })
  createChild(@Body() createChildDto: CreateChildAdminDto) {
    return this.adminService.createChild(createChildDto);
  }

  @Patch('children/:id')
  @ApiOperation({ summary: 'Update a child' })
  @ApiResponse({ status: 200, description: 'Child updated successfully' })
  @ApiResponse({ status: 404, description: 'Child not found' })
  updateChild(@Param('id') id: string, @Body() updateChildDto: UpdateChildDto) {
    return this.adminService.updateChild(parseInt(id), updateChildDto);
  }

  @Delete('children/:id')
  @ApiOperation({ summary: 'Delete a child' })
  @ApiResponse({ status: 200, description: 'Child deleted successfully' })
  @ApiResponse({ status: 404, description: 'Child not found' })
  deleteChild(@Param('id') id: string) {
    return this.adminService.deleteChild(parseInt(id));
  }

  // ==================== Services Management ====================
  @Get('services')
  @ApiOperation({ summary: 'Get all services (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of services' })
  getServices(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isActive') isActive?: string,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const isActiveFilter =
      isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.adminService.getServices(pageNum, limitNum, isActiveFilter);
  }

  @Get('services/:id')
  @ApiOperation({ summary: 'Get a service by ID' })
  @ApiResponse({ status: 200, description: 'Service details' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  getService(@Param('id') id: string) {
    return this.adminService.getService(parseInt(id));
  }

  @Post('services')
  @ApiOperation({ summary: 'Create a new service' })
  @ApiResponse({ status: 201, description: 'Service created successfully' })
  createService(@Body() createServiceDto: CreateServiceDto) {
    return this.adminService.createService(createServiceDto);
  }

  @Patch('services/:id')
  @ApiOperation({ summary: 'Update a service' })
  @ApiResponse({ status: 200, description: 'Service updated successfully' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  updateService(@Param('id') id: string, @Body() updateServiceDto: UpdateServiceDto) {
    return this.adminService.updateService(parseInt(id), updateServiceDto);
  }

  @Delete('services/:id')
  @ApiOperation({ summary: 'Delete a service' })
  @ApiResponse({ status: 200, description: 'Service deleted successfully' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  deleteService(@Param('id') id: string) {
    return this.adminService.deleteService(parseInt(id));
  }

  // ==================== Events Management ====================
  @Get('events')
  @ApiOperation({ summary: 'Get all events (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'isPublished', required: false, type: Boolean })
  @ApiQuery({ name: 'isFeatured', required: false, type: Boolean })
  @ApiQuery({
    name: 'type',
    required: false,
    type: String,
  })
  @ApiResponse({ status: 200, description: 'List of events' })
  getEvents(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isPublished') isPublished?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('type') type?: string,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const isPublishedFilter =
      isPublished === 'true' ? true : isPublished === 'false' ? false : undefined;
    const isFeaturedFilter =
      isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined;
    return this.adminService.getEvents(
      pageNum,
      limitNum,
      isPublishedFilter,
      isFeaturedFilter,
      type,
    );
  }

  @Get('events/:id')
  @ApiOperation({ summary: 'Get an event by ID' })
  @ApiResponse({ status: 200, description: 'Event details' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  getEvent(@Param('id') id: string) {
    return this.adminService.getEvent(parseInt(id));
  }

  @Post('events')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'images', maxCount: 5 },
        { name: 'image', maxCount: 1 },
      ],
      eventImagesMulterOptions,
    ),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  createEvent(
    @Body() createEventDto: CreateEventDto,
    @UploadedFiles()
    files?: {
      images?: Express.Multer.File[];
      image?: Express.Multer.File[];
    },
  ) {
    const uploadFiles = [
      ...(files?.images ?? []),
      ...(files?.image ?? []),
    ];
    return this.adminService.createEvent(createEventDto, uploadFiles);
  }

  @Patch('events/:id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'images', maxCount: 5 },
        { name: 'image', maxCount: 1 },
      ],
      eventImagesMulterOptions,
    ),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update an event' })
  @ApiResponse({ status: 200, description: 'Event updated successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  updateEvent(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @UploadedFiles()
    files?: {
      images?: Express.Multer.File[];
      image?: Express.Multer.File[];
    },
  ) {
    const uploadFiles = [
      ...(files?.images ?? []),
      ...(files?.image ?? []),
    ];
    return this.adminService.updateEvent(parseInt(id), updateEventDto, uploadFiles);
  }

  @Delete('events/:id')
  @ApiOperation({ summary: 'Delete an event' })
  @ApiResponse({ status: 200, description: 'Event deleted successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  deleteEvent(@Param('id') id: string) {
    return this.adminService.deleteEvent(parseInt(id));
  }

  // ==================== FAQs Management ====================
  @Get('faqs')
  @ApiOperation({ summary: 'Get all FAQs (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'isPublished', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of FAQs' })
  getFaqs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isPublished') isPublished?: string,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const isPublishedFilter =
      isPublished === 'true' ? true : isPublished === 'false' ? false : undefined;
    return this.adminService.getFaqs(pageNum, limitNum, isPublishedFilter);
  }

  @Get('faqs/:id')
  @ApiOperation({ summary: 'Get an FAQ by ID' })
  @ApiResponse({ status: 200, description: 'FAQ details' })
  @ApiResponse({ status: 404, description: 'FAQ not found' })
  getFaq(@Param('id') id: string) {
    return this.adminService.getFaq(parseInt(id));
  }

  @Post('faqs')
  @ApiOperation({ summary: 'Create a new FAQ' })
  @ApiResponse({ status: 201, description: 'FAQ created successfully' })
  createFaq(@Body() createFaqDto: CreateFaqDto) {
    return this.adminService.createFaq(createFaqDto);
  }

  @Patch('faqs/:id')
  @ApiOperation({ summary: 'Update an FAQ' })
  @ApiResponse({ status: 200, description: 'FAQ updated successfully' })
  @ApiResponse({ status: 404, description: 'FAQ not found' })
  updateFaq(@Param('id') id: string, @Body() updateFaqDto: UpdateFaqDto) {
    return this.adminService.updateFaq(parseInt(id), updateFaqDto);
  }

  @Delete('faqs/:id')
  @ApiOperation({ summary: 'Delete an FAQ' })
  @ApiResponse({ status: 200, description: 'FAQ deleted successfully' })
  @ApiResponse({ status: 404, description: 'FAQ not found' })
  deleteFaq(@Param('id') id: string) {
    return this.adminService.deleteFaq(parseInt(id));
  }

  // ==================== Appointments Management ====================
  @Get('appointments')
  @ApiOperation({ summary: 'Get all appointments (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: AppointmentStatus,
  })
  @ApiQuery({ name: 'parentId', required: false, type: Number })
  @ApiQuery({ name: 'childId', required: false, type: Number })
  @ApiQuery({ name: 'serviceId', required: false, type: Number })
  @ApiQuery({ name: 'therapistId', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of appointments' })
  getAppointments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: AppointmentStatus,
    @Query('parentId') parentId?: string,
    @Query('childId') childId?: string,
    @Query('serviceId') serviceId?: string,
    @Query('therapistId') therapistId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    return this.adminService.getAppointments(
      pageNum,
      limitNum,
      status,
      parentId ? parseInt(parentId) : undefined,
      childId ? parseInt(childId) : undefined,
      serviceId ? parseInt(serviceId) : undefined,
      therapistId ? parseInt(therapistId) : undefined,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('appointments/:id')
  @ApiOperation({ summary: 'Get an appointment by ID' })
  @ApiResponse({ status: 200, description: 'Appointment details' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  getAppointment(@Param('id') id: string) {
    return this.adminService.getAppointment(parseInt(id));
  }

  @Post('appointments/:id/approve')
  @ApiOperation({ summary: 'Approve an appointment' })
  @ApiResponse({ status: 200, description: 'Appointment approved successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  approveAppointment(
    @Param('id') id: string,
    @Body() approveDto: ApproveAppointmentDto,
  ) {
    return this.adminService.approveAppointment(parseInt(id), approveDto.therapistId);
  }

  @Post('appointments/:id/reject')
  @ApiOperation({ summary: 'Reject an appointment' })
  @ApiResponse({ status: 200, description: 'Appointment rejected successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  rejectAppointment(
    @Param('id') id: string,
    @Body() rejectDto: RejectAppointmentDto,
  ) {
    return this.adminService.rejectAppointment(parseInt(id), rejectDto.reason);
  }

  @Patch('appointments/:id')
  @ApiOperation({ summary: 'Update an appointment' })
  @ApiResponse({ status: 200, description: 'Appointment updated successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  updateAppointment(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ) {
    return this.adminService.updateAppointment(parseInt(id), updateAppointmentDto);
  }

  @Delete('appointments/:id')
  @ApiOperation({ summary: 'Delete an appointment' })
  @ApiResponse({ status: 200, description: 'Appointment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  deleteAppointment(@Param('id') id: string) {
    return this.adminService.deleteAppointment(parseInt(id));
  }

  // ==================== Reports Management ====================
  @Get('reports')
  @ApiOperation({ summary: 'Get all reports (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'childId', required: false, type: Number })
  @ApiQuery({ name: 'therapistId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of reports' })
  getReports(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('childId') childId?: string,
    @Query('therapistId') therapistId?: string,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const childIdNum = childId ? parseInt(childId) : undefined;
    const therapistIdNum = therapistId ? parseInt(therapistId) : undefined;
    return this.adminService.getReports(
      pageNum,
      limitNum,
      childIdNum,
      therapistIdNum,
    );
  }

  @Get('reports/:id')
  @ApiOperation({ summary: 'Get a report by ID' })
  @ApiResponse({ status: 200, description: 'Report details' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  getReport(@Param('id') id: string) {
    return this.adminService.getReport(parseInt(id));
  }

  @Post('reports')
  @ApiOperation({ summary: 'Create a new report' })
  @ApiResponse({ status: 201, description: 'Report created successfully' })
  createReport(@Body() createReportDto: CreateReportDto, @Request() req: any) {
    return this.adminService.createReport(createReportDto, req.user.id);
  }

  @Patch('reports/:id')
  @ApiOperation({ summary: 'Update a report' })
  @ApiResponse({ status: 200, description: 'Report updated successfully' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  updateReport(
    @Param('id') id: string,
    @Body() updateReportDto: UpdateReportDto,
    @Request() req: any,
  ) {
    return this.adminService.updateReport(parseInt(id), updateReportDto, req.user.id);
  }

  @Delete('reports/:id')
  @ApiOperation({ summary: 'Delete a report' })
  @ApiResponse({ status: 200, description: 'Report deleted successfully' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  deleteReport(@Param('id') id: string, @Request() req: any) {
    return this.adminService.deleteReport(parseInt(id), req.user.id);
  }

  // ==================== Audit Logs Management ====================
  @Get('audit-logs')
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
  getAuditLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: AuditAction,
    @Query('entity') entity?: string,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const userIdNum = userId ? parseInt(userId) : undefined;
    return this.adminService.getAuditLogs(
      pageNum,
      limitNum,
      userIdNum,
      action,
      entity,
    );
  }

  @Get('audit-logs/:id')
  @ApiOperation({ summary: 'Get an audit log by ID' })
  @ApiResponse({ status: 200, description: 'Audit log details' })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  getAuditLog(@Param('id') id: string) {
    return this.adminService.getAuditLog(parseInt(id));
  }

  // ==================== Messages Management ====================
  @Get('messages')
  @ApiOperation({ summary: 'Get all messages (paginated)' })
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
    return this.adminService.getMessages(
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
    return this.adminService.getMessage(parseInt(id), req.user.id);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Create a new message' })
  @ApiResponse({ status: 201, description: 'Message created successfully' })
  createMessage(@Body() createMessageDto: CreateMessageDto, @Request() req: any) {
    return this.adminService.createMessage(createMessageDto, req.user.id);
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
    return this.adminService.updateMessage(parseInt(id), updateMessageDto, req.user.id);
  }

  @Delete('messages/:id')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiResponse({ status: 200, description: 'Message deleted successfully' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  deleteMessage(@Param('id') id: string, @Request() req: any) {
    return this.adminService.deleteMessage(parseInt(id), req.user.id);
  }
}

