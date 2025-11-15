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
import { BookAppointmentDto } from './dto/book-appointment.dto';
import { Helper } from '@/utils';
import { User } from '@/entities/user.entity';
import { Child } from '@/entities/child.entity';
import { Service } from '@/entities/service.entity';
import { Role } from '@/common/enums/roles.enum';
import { EmailService } from '@/shared/email/email.service';

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
    private emailService: EmailService,
  ) {}

  /**
   * Book an appointment (public endpoint - checks if parent exists by email)
   * @param bookAppointmentDto - Appointment booking data
   * @returns Created appointment or error if parent doesn't exist
   */
  async bookAppointment(bookAppointmentDto: BookAppointmentDto) {
    // Check if parent exists by email
    const parent = await this.userRepository.findOne({
      where: { email: bookAppointmentDto.email },
    });

    if (!parent) {
      // Send registration required email
      await this.emailService.sendRegistrationRequiredEmail(bookAppointmentDto.email);
      throw new HttpException(
        {
          message: 'Registration required',
          error: 'Please register first to book an appointment',
          email: bookAppointmentDto.email,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Verify service exists
    const service = await this.serviceRepository.findOne({
      where: { id: bookAppointmentDto.serviceId, isActive: true },
    });

    if (!service) {
      throw new HttpException('Service not found or inactive', HttpStatus.NOT_FOUND);
    }

    // Update parent phone number if not set
    if (bookAppointmentDto.phoneNumber && !parent.phone) {
      parent.phone = bookAppointmentDto.phoneNumber;
      await this.userRepository.save(parent);
    }

    // Find or create child
    const [firstName, ...lastNameParts] = bookAppointmentDto.childName.split(' ');
    const lastName = lastNameParts.join(' ') || firstName;

    let child = await this.childRepository.findOne({
      where: {
        parentId: parent.id,
        firstName: firstName,
        lastName: lastName,
      },
    });

    if (!child) {
      // Create child if doesn't exist
      child = this.childRepository.create({
        firstName: firstName,
        lastName: lastName,
        parentId: parent.id,
        dateOfBirth: new Date(bookAppointmentDto.dateOfBirth),
        gender: bookAppointmentDto.gender,
        notes: `${bookAppointmentDto.additionalNotes || ''}`,
      });
      child = await this.childRepository.save(child);
    }

    const defaultTherapistId = await this.getDefaultAdminId();

    // Create appointment
    const appointment = this.appointmentRepository.create({
      appointmentDate: new Date(bookAppointmentDto.appointmentDate),
      serviceId: bookAppointmentDto.serviceId,
      parentId: parent.id,
      childId: child.id,
      therapistId: defaultTherapistId ?? null,
      status: AppointmentStatus.Pending,
      notes: `Preferred Location: ${bookAppointmentDto.preferredLocation}. Urgency: ${bookAppointmentDto.urgencyLevel}. ${bookAppointmentDto.additionalNotes || ''}`,
    });

    const savedAppointment = await this.appointmentRepository.save(appointment);

    // Load relations for email
    const appointmentWithRelations = await this.appointmentRepository.findOne({
      where: { id: savedAppointment.id },
      relations: ['service', 'child'],
    });

    // Send confirmation email
    await this.emailService.sendAppointmentConfirmation(parent.email, {
      serviceName: service.name,
      appointmentDate: savedAppointment.appointmentDate,
      childName: `${child.firstName} ${child.lastName}`,
      notes: appointmentWithRelations?.notes,
    });

    return {
      ...savedAppointment,
      parent: {
        id: parent.id,
        email: parent.email,
        firstName: parent.firstName,
        lastName: parent.lastName,
      },
      child: {
        id: child.id,
        firstName: child.firstName,
        lastName: child.lastName,
      },
      service: {
        id: service.id,
        name: service.name,
      },
    };
  }

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

    // Verify therapist if provided (can be any user with admin role)
    if (createAppointmentDto.therapistId) {
      const therapist = await this.userRepository.findOne({
        where: { id: createAppointmentDto.therapistId },
      });

      if (!therapist) {
        throw new HttpException('Therapist not found', HttpStatus.NOT_FOUND);
      }
    }

    const therapistId =
      createAppointmentDto.therapistId ?? (await this.getDefaultAdminId());

    const appointment = this.appointmentRepository.create({
      ...createAppointmentDto,
      therapistId: therapistId ?? null,
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
   * @param parentId - Filter by parent ID
   * @param childId - Filter by child ID
   * @param serviceId - Filter by service ID
   * @param therapistId - Filter by therapist ID
   * @param startDate - Filter by start date
   * @param endDate - Filter by end date
   * @param userId - User ID (for filtering)
   * @param userRole - User role (for filtering)
   * @returns Paginated list of appointments
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    status?: AppointmentStatus,
    parentId?: number,
    childId?: number,
    serviceId?: number,
    therapistId?: number,
    startDate?: Date,
    endDate?: Date,
    userId?: number,
    userRole?: Role,
  ) {
    const queryBuilder = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.parent', 'parent')
      .leftJoinAndSelect('appointment.child', 'child')
      .leftJoinAndSelect('appointment.therapist', 'therapist')
      .leftJoinAndSelect('appointment.service', 'service');

    // Apply filters
    if (status) {
      queryBuilder.andWhere('appointment.status = :status', { status });
    }

    if (parentId) {
      queryBuilder.andWhere('appointment.parentId = :parentId', { parentId });
    }

    if (childId) {
      queryBuilder.andWhere('appointment.childId = :childId', { childId });
    }

    if (serviceId) {
      queryBuilder.andWhere('appointment.serviceId = :serviceId', { serviceId });
    }

    if (therapistId) {
      queryBuilder.andWhere('appointment.therapistId = :therapistId', { therapistId });
    }

    if (startDate) {
      queryBuilder.andWhere('appointment.appointmentDate >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('appointment.appointmentDate <= :endDate', { endDate });
    }

    // Parents can only see their own appointments
    if (userRole === Role.Parent) {
      queryBuilder.andWhere('appointment.parentId = :userId', { userId });
    }

    // Admins can see all appointments (no filter applied)

    const [appointments, total] = await queryBuilder
      .orderBy('appointment.appointmentDate', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

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

    // Admins can access all appointments

    return appointment;
  }

  /**
   * Approve an appointment
   * @param id - Appointment ID
   * @param therapistId - Optional therapist ID to assign
   * @returns Updated appointment
   */
  async approveAppointment(id: number, therapistId?: number): Promise<Appointment> {
    const appointment = await this.findOne(id);

    if (appointment.status !== AppointmentStatus.Pending) {
      throw new HttpException(
        'Only pending appointments can be approved',
        HttpStatus.BAD_REQUEST,
      );
    }

    appointment.status = AppointmentStatus.Approved;
    if (therapistId) {
      const therapist = await this.userRepository.findOne({
        where: { id: therapistId },
      });

      if (!therapist) {
        throw new HttpException('Therapist not found', HttpStatus.NOT_FOUND);
      }

      appointment.therapistId = therapistId;
    }

    const updatedAppointment = await this.appointmentRepository.save(appointment);

    // Load relations for email
    const appointmentWithRelations = await this.appointmentRepository.findOne({
      where: { id: updatedAppointment.id },
      relations: ['parent', 'child', 'service', 'therapist'],
    });

    // Send approval email
    if (appointmentWithRelations) {
      await this.emailService.sendAppointmentConfirmation(
        appointmentWithRelations.parent.email,
        {
          serviceName: appointmentWithRelations.service.name,
          appointmentDate: appointmentWithRelations.appointmentDate,
          childName: `${appointmentWithRelations.child.firstName} ${appointmentWithRelations.child.lastName}`,
          notes: `Your appointment has been approved. ${appointmentWithRelations.notes || ''}`,
        },
      );
    }

    return updatedAppointment;
  }

  /**
   * Reject an appointment
   * @param id - Appointment ID
   * @param reason - Rejection reason
   * @returns Updated appointment
   */
  async rejectAppointment(id: number, reason?: string): Promise<Appointment> {
    const appointment = await this.findOne(id);

    if (appointment.status !== AppointmentStatus.Pending) {
      throw new HttpException(
        'Only pending appointments can be rejected',
        HttpStatus.BAD_REQUEST,
      );
    }

    appointment.status = AppointmentStatus.Rejected;
    if (reason) {
      appointment.cancellationReason = reason;
    }

    const updatedAppointment = await this.appointmentRepository.save(appointment);

    // Load relations for email
    const appointmentWithRelations = await this.appointmentRepository.findOne({
      where: { id: updatedAppointment.id },
      relations: ['parent', 'child', 'service'],
    });

    // Send rejection email
    if (appointmentWithRelations) {
      await this.emailService.sendEmail(
        appointmentWithRelations.parent.email,
        'Appointment Rejected - Crystal Ladder',
        `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">Crystal Ladder</h1>
              </div>
              <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333; margin-top: 0;">Appointment Rejected</h2>
                <p>We regret to inform you that your appointment request has been rejected.</p>
                <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <p><strong>Service:</strong> ${appointmentWithRelations.service.name}</p>
                  <p><strong>Child:</strong> ${appointmentWithRelations.child.firstName} ${appointmentWithRelations.child.lastName}</p>
                  <p><strong>Date & Time:</strong> ${new Date(appointmentWithRelations.appointmentDate).toLocaleString('en-US')}</p>
                  ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
                </div>
                <p style="color: #666; font-size: 14px;">Please contact us if you have any questions or would like to reschedule.</p>
                <p style="margin-top: 30px; color: #666; font-size: 14px;">Best regards,<br>The Crystal Ladder Team</p>
              </div>
            </body>
          </html>
        `,
      );
    }

    return updatedAppointment;
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

    // Only admin can approve/reject
    if (
      updateAppointmentDto.status &&
      [AppointmentStatus.Approved, AppointmentStatus.Rejected].includes(
        updateAppointmentDto.status,
      ) &&
      userRole !== Role.Admin
    ) {
      throw new HttpException(
        'Only admin can approve/reject appointments',
        HttpStatus.FORBIDDEN,
      );
    }

    // Verify therapist if being assigned (can be any user)
    if (updateAppointmentDto.therapistId) {
      const therapist = await this.userRepository.findOne({
        where: { id: updateAppointmentDto.therapistId },
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

  private async getDefaultAdminId(): Promise<number | null> {
    const admin = await this.userRepository.findOne({
      where: { role: Role.Admin, isApproved: true },
      order: { createdAt: 'ASC' },
    });

    return admin?.id ?? null;
  }
}

