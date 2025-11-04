import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from '@/entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Helper } from '@/utils';
import { User } from '@/entities/user.entity';
import { Child } from '@/entities/child.entity';
import { Service } from '@/entities/service.entity';
import { Role } from '@/common/enums/roles.enum';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Child)
    private childRepository: Repository<Child>,
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
  ) {}

  /**
   * Create a new appointment
   * @param createAppointmentDto - Appointment data
   * @param parentId - Parent user ID
   * @returns Created appointment
   */
  async create(
    createAppointmentDto: CreateAppointmentDto,
    parentId: number,
  ): Promise<Appointment> {
    // Verify child belongs to parent
    const child = await this.childRepository.findOne({
      where: { id: createAppointmentDto.childId, parentId },
    });

    if (!child) {
      throw new HttpException(
        'Child not found or does not belong to you',
        HttpStatus.NOT_FOUND,
      );
    }

    // Verify service exists
    const service = await this.serviceRepository.findOne({
      where: { id: createAppointmentDto.serviceId, isActive: true },
    });

    if (!service) {
      throw new HttpException('Service not found or inactive', HttpStatus.NOT_FOUND);
    }

    // Verify therapist if provided
    if (createAppointmentDto.therapistId) {
      const therapist = await this.userRepository.findOne({
        where: { id: createAppointmentDto.therapistId, role: Role.Therapist },
      });

      if (!therapist) {
        throw new HttpException('Therapist not found', HttpStatus.NOT_FOUND);
      }
    }

    const appointment = this.appointmentRepository.create({
      ...createAppointmentDto,
      parentId,
      status: AppointmentStatus.Pending,
    });

    return await this.appointmentRepository.save(appointment);
  }

  /**
   * Find all appointments (paginated)
   * @param page - Page number
   * @param limit - Items per page
   * @param status - Filter by status
   * @param userId - User ID (for filtering)
   * @param userRole - User role (for filtering)
   * @returns Paginated list of appointments
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    status?: AppointmentStatus,
    userId?: number,
    userRole?: Role,
  ) {
    const where: any = {};

    if (status) {
      where.status = status;
    }

    // Parents can only see their own appointments
    if (userRole === Role.Parent) {
      where.parentId = userId;
    }

    // Therapists can see their assigned appointments
    if (userRole === Role.Therapist) {
      where.therapistId = userId;
    }

    const [appointments, total] = await this.appointmentRepository.findAndCount({
      where,
      relations: ['parent', 'child', 'therapist', 'service'],
      skip: (page - 1) * limit,
      take: limit,
      order: { appointmentDate: 'ASC' },
    });

    return Helper.paginateResponse({ data: [appointments, total], page, limit });
  }

  /**
   * Find one appointment by ID
   * @param id - Appointment ID
   * @param userId - User ID (for authorization check)
   * @param userRole - User role (for authorization check)
   * @returns Appointment record
   */
  async findOne(
    id: number,
    userId?: number,
    userRole?: Role,
  ): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['parent', 'child', 'therapist', 'service'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Check authorization
    if (userRole === Role.Parent && appointment.parentId !== userId) {
      throw new HttpException('Unauthorized access', HttpStatus.FORBIDDEN);
    }

    if (userRole === Role.Therapist && appointment.therapistId !== userId) {
      throw new HttpException('Unauthorized access', HttpStatus.FORBIDDEN);
    }

    return appointment;
  }

  /**
   * Update appointment (approve/reject/reschedule)
   * @param id - Appointment ID
   * @param updateAppointmentDto - Updated appointment data
   * @param userId - User ID (for authorization check)
   * @param userRole - User role (for authorization check)
   * @returns Updated appointment
   */
  async update(
    id: number,
    updateAppointmentDto: UpdateAppointmentDto,
    userId?: number,
    userRole?: Role,
  ): Promise<Appointment> {
    const appointment = await this.findOne(id, userId, userRole);

    // Only admin and therapist can approve/reject
    if (
      updateAppointmentDto.status &&
      [AppointmentStatus.Approved, AppointmentStatus.Rejected].includes(
        updateAppointmentDto.status,
      ) &&
      ![Role.Admin, Role.Therapist].includes(userRole)
    ) {
      throw new HttpException(
        'Only admin or therapist can approve/reject appointments',
        HttpStatus.FORBIDDEN,
      );
    }

    // Verify therapist if being assigned
    if (updateAppointmentDto.therapistId) {
      const therapist = await this.userRepository.findOne({
        where: { id: updateAppointmentDto.therapistId, role: Role.Therapist },
      });

      if (!therapist) {
        throw new HttpException('Therapist not found', HttpStatus.NOT_FOUND);
      }
    }

    Object.assign(appointment, updateAppointmentDto);
    return await this.appointmentRepository.save(appointment);
  }

  /**
   * Remove appointment (soft delete)
   * @param id - Appointment ID
   * @param userId - User ID (for authorization check)
   * @param userRole - User role (for authorization check)
   */
  async remove(
    id: number,
    userId?: number,
    userRole?: Role,
  ): Promise<void> {
    const appointment = await this.findOne(id, userId, userRole);

    // Only admin can hard delete
    if (userRole !== Role.Admin) {
      // Parents can cancel their own appointments
      if (appointment.parentId === userId) {
        appointment.status = AppointmentStatus.Cancelled;
        await this.appointmentRepository.save(appointment);
        return;
      }
      throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
    }

    await this.appointmentRepository.softRemove(appointment);
  }
}

