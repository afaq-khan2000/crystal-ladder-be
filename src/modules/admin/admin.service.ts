import { Injectable } from '@nestjs/common';
import { Express } from 'express';
import { UserService } from '../user/user.service';
import { ChildrenService } from '../children/children.service';
import { ServicesService } from '../services/services.service';
import { EventsService } from '../events/events.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { ReportsService } from '../reports/reports.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { CreateServiceDto } from '../services/dto/create-service.dto';
import { UpdateServiceDto } from '../services/dto/update-service.dto';
import { CreateEventDto } from '../events/dto/create-event.dto';
import { UpdateEventDto } from '../events/dto/update-event.dto';
import { UpdateUserDto } from '../user/dto/update-user.dto';
import { CreateChildDto } from '../children/dto/create-child.dto';
import { UpdateChildDto } from '../children/dto/update-child.dto';
import { CreateChildAdminDto } from './dto/create-child-admin.dto';
import { CreateReportDto } from '../reports/dto/create-report.dto';
import { UpdateReportDto } from '../reports/dto/update-report.dto';
import { UpdateAppointmentDto } from '../appointments/dto/update-appointment.dto';
import { AppointmentStatus } from '@/entities/appointment.entity';
import { Role } from '@/common/enums/roles.enum';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { MessagesService } from '../messages/messages.service';
import { AuditAction } from '@/entities/audit-log.entity';
import { CreateMessageDto } from '../messages/dto/create-message.dto';
import { UpdateMessageDto } from '../messages/dto/update-message.dto';
import { MessageType } from '@/entities/message.entity';
import { FaqsService } from '../faqs/faqs.service';
import { CreateFaqDto } from '../faqs/dto/create-faq.dto';
import { UpdateFaqDto } from '../faqs/dto/update-faq.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly userService: UserService,
    private readonly childrenService: ChildrenService,
    private readonly servicesService: ServicesService,
    private readonly eventsService: EventsService,
    private readonly appointmentsService: AppointmentsService,
    private readonly reportsService: ReportsService,
    private readonly dashboardService: DashboardService,
    private readonly auditLogsService: AuditLogsService,
    private readonly messagesService: MessagesService,
    private readonly faqsService: FaqsService,
  ) {}

  // ==================== Dashboard ====================
  async getDashboard(days: number = 30) {
    return this.dashboardService.getDashboard(days);
  }

  async getStats() {
    return this.dashboardService.getStats();
  }

  // ==================== Users Management ====================
  async getUsers(
    page: number = 1,
    limit: number = 10,
    role?: Role,
    isApproved?: boolean,
    isEmailVerified?: boolean,
  ) {
    return this.userService.findAll(page, limit, role, isApproved, isEmailVerified);
  }

  async getUser(id: number) {
    return this.userService.findOne(id);
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  async approveUser(id: number) {
    return this.userService.approveUser(id);
  }

  async unapproveUser(id: number) {
    return this.userService.unapproveUser(id);
  }

  async deleteUser(id: string) {
    return this.userService.softDeleteUser(id);
  }

  // ==================== Children Management ====================
  async getChildren(page: number = 1, limit: number = 10) {
    return this.childrenService.findAll(page, limit);
  }

  async getChild(id: number) {
    return this.childrenService.findOne(id);
  }

  async createChild(createChildDto: CreateChildAdminDto) {
    // For admin, we can create child with any parentId from the DTO
    const { parentId, ...childData } = createChildDto;
    return this.childrenService.create(childData as CreateChildDto, parentId);
  }

  async updateChild(id: number, updateChildDto: UpdateChildDto) {
    // Admin can update any child without authorization check (pass undefined for userId/role to bypass checks)
    return this.childrenService.update(id, updateChildDto);
  }

  async deleteChild(id: number) {
    // Admin can delete any child (pass undefined to bypass authorization)
    return this.childrenService.remove(id);
  }

  // ==================== Services Management ====================
  async getServices(page: number = 1, limit: number = 10, isActive?: boolean) {
    return this.servicesService.findAll(page, limit, isActive);
  }

  async getService(id: number) {
    return this.servicesService.findOne(id);
  }

  async createService(createServiceDto: CreateServiceDto) {
    return this.servicesService.create(createServiceDto);
  }

  async updateService(id: number, updateServiceDto: UpdateServiceDto) {
    return this.servicesService.update(id, updateServiceDto);
  }

  async deleteService(id: number) {
    return this.servicesService.remove(id);
  }

  // ==================== Events Management ====================
  async getEvents(
    page: number = 1,
    limit: number = 10,
    isPublished?: boolean,
    isFeatured?: boolean,
    type?: string,
  ) {
    return this.eventsService.findAll(page, limit, isPublished, isFeatured, type);
  }

  async getEvent(id: number) {
    return this.eventsService.findOne(id);
  }

  async createEvent(createEventDto: CreateEventDto, imageFiles?: Express.Multer.File[]) {
    return this.eventsService.create(createEventDto, imageFiles);
  }

  async updateEvent(
    id: number,
    updateEventDto: UpdateEventDto,
    imageFiles?: Express.Multer.File[],
  ) {
    return this.eventsService.update(id, updateEventDto, imageFiles);
  }

  async deleteEvent(id: number) {
    return this.eventsService.remove(id);
  }

  // ==================== FAQs Management ====================
  async getFaqs(page: number = 1, limit: number = 10, isPublished?: boolean) {
    return this.faqsService.findAll(page, limit, isPublished);
  }

  async getFaq(id: number) {
    return this.faqsService.findOne(id);
  }

  async createFaq(createFaqDto: CreateFaqDto) {
    return this.faqsService.create(createFaqDto);
  }

  async updateFaq(id: number, updateFaqDto: UpdateFaqDto) {
    return this.faqsService.update(id, updateFaqDto);
  }

  async deleteFaq(id: number) {
    return this.faqsService.remove(id);
  }

  // ==================== Appointments Management ====================
  async getAppointments(
    page: number = 1,
    limit: number = 10,
    status?: AppointmentStatus,
    parentId?: number,
    childId?: number,
    serviceId?: number,
    therapistId?: number,
    startDate?: Date,
    endDate?: Date,
  ) {
    // Admin can see all appointments (pass undefined for userId/role to see all)
    return this.appointmentsService.findAll(
      page,
      limit,
      status,
      parentId,
      childId,
      serviceId,
      therapistId,
      startDate,
      endDate,
      undefined, // userId - undefined means admin sees all
      Role.Admin, // userRole - Admin role
    );
  }

  async getAppointment(id: number) {
    // Admin can see any appointment (pass undefined for userId, Admin role)
    return this.appointmentsService.findOne(id, undefined, Role.Admin);
  }

  async approveAppointment(id: number, therapistId?: number) {
    return this.appointmentsService.approveAppointment(id, therapistId);
  }

  async rejectAppointment(id: number, reason?: string) {
    return this.appointmentsService.rejectAppointment(id, reason);
  }

  async updateAppointment(id: number, updateAppointmentDto: UpdateAppointmentDto) {
    // Admin can update any appointment (pass undefined for userId, Admin role)
    return this.appointmentsService.update(id, updateAppointmentDto, undefined, Role.Admin);
  }

  async deleteAppointment(id: number) {
    // Admin can delete any appointment (pass undefined for userId, Admin role)
    return this.appointmentsService.remove(id, undefined, Role.Admin);
  }

  // ==================== Reports Management ====================
  async getReports(
    page: number = 1,
    limit: number = 10,
    childId?: number,
    therapistId?: number,
  ) {
    // Admin can see all reports (pass undefined for userId, Admin role)
    return this.reportsService.findAll(
      page,
      limit,
      childId,
      therapistId,
      undefined, // userId - undefined means admin sees all
      Role.Admin, // userRole - Admin role
    );
  }

  async getReport(id: number) {
    // Admin can see any report (pass undefined for userId, Admin role)
    return this.reportsService.findOne(id, undefined, Role.Admin);
  }

  async createReport(createReportDto: CreateReportDto, adminId: number) {
    return this.reportsService.create(createReportDto, adminId);
  }

  async updateReport(id: number, updateReportDto: UpdateReportDto, adminId: number) {
    return this.reportsService.update(id, updateReportDto, adminId, Role.Admin);
  }

  async deleteReport(id: number, adminId: number) {
    return this.reportsService.remove(id, adminId, Role.Admin);
  }

  // ==================== Audit Logs Management ====================
  async getAuditLogs(
    page: number = 1,
    limit: number = 10,
    userId?: number,
    action?: AuditAction,
    entity?: string,
  ) {
    return this.auditLogsService.findAll(page, limit, userId, action, entity);
  }

  async getAuditLog(id: number) {
    return this.auditLogsService.findOne(id);
  }

  // ==================== Messages Management ====================
  async getMessages(
    adminId: number,
    page: number = 1,
    limit: number = 10,
    type?: MessageType,
    isRead?: boolean,
  ) {
    // Admin can see all messages
    return this.messagesService.findAll(page, limit, adminId, Role.Admin, type, isRead);
  }

  async getMessage(id: number, adminId: number) {
    // Admin can see any message
    return this.messagesService.findOne(id, adminId, Role.Admin);
  }

  async createMessage(createMessageDto: CreateMessageDto, adminId: number) {
    return this.messagesService.create(createMessageDto, adminId);
  }

  async updateMessage(id: number, updateMessageDto: UpdateMessageDto, adminId: number) {
    return this.messagesService.update(id, updateMessageDto, adminId, Role.Admin);
  }

  async deleteMessage(id: number, adminId: number) {
    return this.messagesService.remove(id, adminId, Role.Admin);
  }
}

