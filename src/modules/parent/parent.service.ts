import { Injectable } from '@nestjs/common';
import { ChildrenService } from '../children/children.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { ReportsService } from '../reports/reports.service';
import { CreateChildDto } from '../children/dto/create-child.dto';
import { UpdateChildDto } from '../children/dto/update-child.dto';
import { CreateAppointmentDto } from '../appointments/dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../appointments/dto/update-appointment.dto';
import { AppointmentStatus } from '@/entities/appointment.entity';
import { Role } from '@/common/enums/roles.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '@/entities/appointment.entity';
import { Child } from '@/entities/child.entity';
import { Report } from '@/entities/report.entity';
import { User } from '@/entities/user.entity';
import { MessagesService } from '../messages/messages.service';
import { CreateMessageDto } from '../messages/dto/create-message.dto';
import { UpdateMessageDto } from '../messages/dto/update-message.dto';
import { MessageType } from '@/entities/message.entity';

@Injectable()
export class ParentService {
  constructor(
    private readonly childrenService: ChildrenService,
    private readonly appointmentsService: AppointmentsService,
    private readonly reportsService: ReportsService,
    private readonly messagesService: MessagesService,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(Child)
    private childRepository: Repository<Child>,
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // ==================== Dashboard ====================
  async getDashboard(parentId: number) {
    const [stats, recentAppointments, children, recentReports] = await Promise.all([
      this.getStats(parentId),
      this.getRecentAppointments(parentId, 5),
      this.getChildren(parentId, 1, 5),
      this.getRecentReports(parentId, 5),
    ]);

    return {
      stats,
      recentAppointments,
      children: children.data || [],
      recentReports,
    };
  }

  async getStats(parentId: number) {
    // Get children count
    const childrenCount = await this.childRepository.count({
      where: { parentId },
    });

    // Get appointments count
    const [totalAppointments, pendingAppointments, approvedAppointments, completedAppointments] =
      await Promise.all([
        this.appointmentRepository.count({ where: { parentId } }),
        this.appointmentRepository.count({
          where: { parentId, status: AppointmentStatus.Pending },
        }),
        this.appointmentRepository.count({
          where: { parentId, status: AppointmentStatus.Approved },
        }),
        this.appointmentRepository.count({
          where: { parentId, status: AppointmentStatus.Completed },
        }),
      ]);

    // Get reports count (through children)
    const children = await this.childRepository.find({
      where: { parentId },
      select: ['id'],
    });
    const childIds = children.map((child) => child.id);
    const reportsCount =
      childIds.length > 0
        ? await this.reportRepository
            .createQueryBuilder('report')
            .where('report.childId IN (:...childIds)', { childIds })
            .getCount()
        : 0;

    return {
      childrenCount,
      totalAppointments,
      pendingAppointments,
      approvedAppointments,
      completedAppointments,
      reportsCount,
    };
  }

  async getRecentAppointments(parentId: number, limit: number = 5) {
    const appointments = await this.appointmentRepository.find({
      where: { parentId },
      relations: ['child', 'service', 'therapist'],
      order: { appointmentDate: 'DESC' },
      take: limit,
    });

    return appointments
      .filter((appointment) => appointment.child && appointment.service)
      .map((appointment) => ({
        id: appointment.id,
        appointmentDate: appointment.appointmentDate,
        status: appointment.status,
        child: appointment.child
          ? {
              id: appointment.child.id,
              firstName: appointment.child.firstName,
              lastName: appointment.child.lastName,
            }
          : null,
        service: appointment.service
          ? {
              id: appointment.service.id,
              name: appointment.service.name,
            }
          : null,
        therapist: appointment.therapist
          ? {
              id: appointment.therapist.id,
              firstName: appointment.therapist.firstName,
              lastName: appointment.therapist.lastName,
            }
          : null,
        notes: appointment.notes,
      }));
  }

  async getRecentReports(parentId: number, limit: number = 5) {
    const children = await this.childRepository.find({
      where: { parentId },
      select: ['id'],
    });
    const childIds = children.map((child) => child.id);

    if (childIds.length === 0) {
      return [];
    }

    const reports = await this.reportRepository
      .createQueryBuilder('report')
      .where('report.childId IN (:...childIds)', { childIds })
      .leftJoinAndSelect('report.child', 'child')
      .leftJoinAndSelect('report.therapist', 'therapist')
      .orderBy('report.createdAt', 'DESC')
      .take(limit)
      .getMany();

    return reports.map((report) => ({
      id: report.id,
      title: report.title,
      type: report.type,
      child: {
        id: report.child.id,
        firstName: report.child.firstName,
        lastName: report.child.lastName,
      },
      therapist: report.therapist
        ? {
            id: report.therapist.id,
            firstName: report.therapist.firstName,
            lastName: report.therapist.lastName,
          }
        : null,
      createdAt: report.createdAt,
    }));
  }

  // ==================== Children Management ====================
  async getChildren(parentId: number, page: number = 1, limit: number = 10) {
    return this.childrenService.findAllByParent(parentId, page, limit);
  }

  async getChild(id: number, parentId: number) {
    return this.childrenService.findOne(id, parentId, Role.Parent);
  }

  async createChild(createChildDto: CreateChildDto, parentId: number) {
    return this.childrenService.create(createChildDto, parentId);
  }

  async updateChild(id: number, updateChildDto: UpdateChildDto, parentId: number) {
    return this.childrenService.update(id, updateChildDto, parentId, Role.Parent);
  }

  async deleteChild(id: number, parentId: number) {
    return this.childrenService.remove(id, parentId, Role.Parent);
  }

  // ==================== Appointments Management ====================
  async getAppointments(
    parentId: number,
    page: number = 1,
    limit: number = 10,
    status?: AppointmentStatus,
    childId?: number,
    serviceId?: number,
    startDate?: Date,
    endDate?: Date,
  ) {
    return this.appointmentsService.findAll(
      page,
      limit,
      status,
      parentId,
      childId,
      serviceId,
      undefined,
      startDate,
      endDate,
      parentId,
      Role.Parent,
    );
  }

  async getAppointment(id: number, parentId: number) {
    return this.appointmentsService.findOne(id, parentId, Role.Parent);
  }

  async createAppointment(createAppointmentDto: CreateAppointmentDto, parentId: number) {
    return this.appointmentsService.create(createAppointmentDto, parentId);
  }

  async updateAppointment(
    id: number,
    updateAppointmentDto: UpdateAppointmentDto,
    parentId: number,
  ) {
    return this.appointmentsService.update(id, updateAppointmentDto, parentId, Role.Parent);
  }

  async cancelAppointment(id: number, parentId: number) {
    return this.appointmentsService.remove(id, parentId, Role.Parent);
  }

  // ==================== Progress Reports ====================
  async getProgress(
    parentId: number,
    page: number = 1,
    limit: number = 10,
    childId?: number,
  ) {
    return this.reportsService.findAll(page, limit, childId, undefined, parentId, Role.Parent);
  }

  async getProgressReport(id: number, parentId: number) {
    return this.reportsService.findOne(id, parentId, Role.Parent);
  }

  async getChildProgress(
    parentId: number,
    childId: number,
    page: number = 1,
    limit: number = 10,
  ) {
    // Verify child belongs to parent
    const child = await this.childRepository.findOne({
      where: { id: childId, parentId },
    });

    if (!child) {
      throw new Error('Child not found or does not belong to you');
    }

    return this.reportsService.findAll(page, limit, childId, undefined, parentId, Role.Parent);
  }

  // ==================== Messages Management ====================
  async getMessages(
    parentId: number,
    page: number = 1,
    limit: number = 10,
    type?: MessageType,
    isRead?: boolean,
  ) {
    // Parents can see messages sent to them or announcements/newsletters
    return this.messagesService.findAll(page, limit, parentId, Role.Parent, type, isRead);
  }

  async getMessage(id: number, parentId: number) {
    return this.messagesService.findOne(id, parentId, Role.Parent);
  }

  async createMessage(createMessageDto: CreateMessageDto, parentId: number) {
    return this.messagesService.create(createMessageDto, parentId);
  }

  async updateMessage(id: number, updateMessageDto: UpdateMessageDto, parentId: number) {
    return this.messagesService.update(id, updateMessageDto, parentId, Role.Parent);
  }

  async markMessageAsRead(id: number, parentId: number) {
    return this.messagesService.markAsRead(id, parentId);
  }

  async deleteMessage(id: number, parentId: number) {
    return this.messagesService.remove(id, parentId, Role.Parent);
  }
}

