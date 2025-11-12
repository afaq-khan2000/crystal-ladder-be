import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Appointment, AppointmentStatus } from '@/entities/appointment.entity';
import { User } from '@/entities/user.entity';
import { Child } from '@/entities/child.entity';
import { Service } from '@/entities/service.entity';
import { Report } from '@/entities/report.entity';
import { Role } from '@/common/enums/roles.enum';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Child)
    private childRepository: Repository<Child>,
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
  ) {}

  /**
   * Get dashboard statistics (4 cards)
   * @returns Dashboard stats
   */
  async getStats() {
    const [
      totalParents,
      totalChildren,
      totalAppointments,
      pendingAppointments,
      approvedAppointments,
      totalServices,
      totalReports,
    ] = await Promise.all([
      this.userRepository.count({ where: { role: Role.Parent } }),
      this.childRepository.count(),
      this.appointmentRepository.count(),
      this.appointmentRepository.count({
        where: { status: AppointmentStatus.Pending },
      }),
      this.appointmentRepository.count({
        where: { status: AppointmentStatus.Approved },
      }),
      this.serviceRepository.count({ where: { isActive: true } }),
      this.reportRepository.count(),
    ]);

    return {
      totalParents,
      totalChildren,
      totalAppointments,
      pendingAppointments,
      approvedAppointments,
      totalServices,
      totalReports,
    };
  }

  /**
   * Get hot actions (pending/approved appointments, etc.)
   * @returns Hot actions data
   */
  async getHotActions() {
    const [
      pendingAppointments,
      approvedAppointments,
      recentAppointments,
      unverifiedUsers,
    ] = await Promise.all([
      this.appointmentRepository.count({
        where: { status: AppointmentStatus.Pending },
      }),
      this.appointmentRepository.count({
        where: { status: AppointmentStatus.Approved },
      }),
      this.appointmentRepository.count({
        where: {
          createdAt: Between(
            new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            new Date(),
          ),
        },
      }),
      this.userRepository.count({
        where: { role: Role.Parent, isEmailVerified: false },
      }),
    ]);

    return {
      pendingAppointments,
      approvedAppointments,
      recentAppointments,
      unverifiedUsers,
      actions: [
        {
          type: 'appointment',
          label: 'Pending Appointments',
          count: pendingAppointments,
          status: 'pending',
          priority: 'high',
        },
        {
          type: 'appointment',
          label: 'Approved Appointments',
          count: approvedAppointments,
          status: 'approved',
          priority: 'medium',
        },
        {
          type: 'user',
          label: 'Unverified Users',
          count: unverifiedUsers,
          status: 'unverified',
          priority: 'medium',
        },
        {
          type: 'appointment',
          label: 'Recent Appointments (24h)',
          count: recentAppointments,
          status: 'recent',
          priority: 'low',
        },
      ],
    };
  }

  /**
   * Get graph data for appointments over time
   * @param days - Number of days to look back (default: 30)
   * @returns Graph data
   */
  async getAppointmentsGraphData(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get all appointments in the date range
    const allAppointments = await this.appointmentRepository.find({
      where: {
        appointmentDate: Between(startDate, new Date()),
      },
      select: ['appointmentDate', 'status'],
    });

    // Group by date
    const appointmentsByDate = new Map<string, number>();
    allAppointments.forEach((apt) => {
      const dateKey = apt.appointmentDate.toISOString().split('T')[0];
      appointmentsByDate.set(
        dateKey,
        (appointmentsByDate.get(dateKey) || 0) + 1,
      );
    });

    // Group by status
    const appointmentsByStatus = new Map<string, number>();
    allAppointments.forEach((apt) => {
      appointmentsByStatus.set(
        apt.status,
        (appointmentsByStatus.get(apt.status) || 0) + 1,
      );
    });

    return {
      appointmentsOverTime: Array.from(appointmentsByDate.entries()).map(
        ([date, count]) => ({
          date,
          count,
        }),
      ),
      appointmentsByStatus: Array.from(appointmentsByStatus.entries()).map(
        ([status, count]) => ({
          status,
          count,
        }),
      ),
    };
  }

  /**
   * Get graph data for users/children growth
   * @param days - Number of days to look back (default: 30)
   * @returns Graph data
   */
  async getUsersGrowthGraphData(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const [users, children] = await Promise.all([
      this.userRepository.find({
        where: {
          role: Role.Parent,
          createdAt: Between(startDate, new Date()),
        },
        select: ['createdAt'],
      }),
      this.childRepository.find({
        where: {
          createdAt: Between(startDate, new Date()),
        },
        select: ['createdAt'],
      }),
    ]);

    // Group by date
    const usersByDate = new Map<string, number>();
    users.forEach((user) => {
      const dateKey = user.createdAt.toISOString().split('T')[0];
      usersByDate.set(dateKey, (usersByDate.get(dateKey) || 0) + 1);
    });

    const childrenByDate = new Map<string, number>();
    children.forEach((child) => {
      const dateKey = child.createdAt.toISOString().split('T')[0];
      childrenByDate.set(dateKey, (childrenByDate.get(dateKey) || 0) + 1);
    });

    return {
      usersGrowth: Array.from(usersByDate.entries()).map(([date, count]) => ({
        date,
        count,
      })),
      childrenGrowth: Array.from(childrenByDate.entries()).map(
        ([date, count]) => ({
          date,
          count,
        }),
      ),
    };
  }

  /**
   * Get recent appointments (last 5)
   * @returns Recent appointments
   */
  async getRecentAppointments(limit: number = 5) {
    const appointments = await this.appointmentRepository.find({
      relations: ['parent', 'child', 'service', 'therapist'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return appointments.map((appointment) => ({
      id: appointment.id,
      appointmentDate: appointment.appointmentDate,
      status: appointment.status,
      parent: {
        id: appointment.parent.id,
        firstName: appointment.parent.firstName,
        lastName: appointment.parent.lastName,
        email: appointment.parent.email,
      },
      child: {
        id: appointment.child.id,
        firstName: appointment.child.firstName,
        lastName: appointment.child.lastName,
      },
      service: {
        id: appointment.service.id,
        name: appointment.service.name,
      },
      therapist: appointment.therapist
        ? {
            id: appointment.therapist.id,
            firstName: appointment.therapist.firstName,
            lastName: appointment.therapist.lastName,
          }
        : null,
      notes: appointment.notes,
      createdAt: appointment.createdAt,
    }));
  }

  /**
   * Get complete dashboard data
   * @param days - Number of days for graph data
   * @returns Complete dashboard data
   */
  async getDashboard(days: number = 30) {
    const [stats, hotActions, appointmentsGraph, usersGrowthGraph, recentAppointments] =
      await Promise.all([
        this.getStats(),
        this.getHotActions(),
        this.getAppointmentsGraphData(days),
        this.getUsersGrowthGraphData(days),
        this.getRecentAppointments(5),
      ]);

    return {
      stats,
      hotActions,
      graphs: {
        appointments: appointmentsGraph,
        usersGrowth: usersGrowthGraph,
      },
      recentAppointments,
    };
  }
}

