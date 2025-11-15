import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/entities/user.entity';
import { Child } from '@/entities/child.entity';
import { Service } from '@/entities/service.entity';
import { Appointment, AppointmentStatus } from '@/entities/appointment.entity';
import { Report, ReportType } from '@/entities/report.entity';
import { Message, MessageType } from '@/entities/message.entity';
import { Event } from '@/entities/event.entity';
import { AuditLog, AuditAction } from '@/entities/audit-log.entity';
import { Role } from '@/common/enums/roles.enum';
import { Helper } from '@/utils';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Child)
    private childRepository: Repository<Child>,
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async seed() {
    try {
      this.logger.log('🌱 Starting database seeding...');

      // Clear existing data (optional - comment out if you want to keep existing data)
      await this.clearDatabase();

      // Seed in order due to dependencies
      const users = await this.seedUsers();
      const services = await this.seedServices();
      const children = await this.seedChildren(users);
      const appointments = await this.seedAppointments(users, children, services);
      await this.seedReports(users, children);
      await this.seedMessages(users);
      await this.seedEvents();
      await this.seedAuditLogs(users);

      this.logger.log('✅ Database seeding completed successfully!');
      return {
        users: users.length,
        children: children.length,
        services: services.length,
        appointments: appointments.length,
      };
    } catch (error) {
      this.logger.error('❌ Error seeding database:', error);
      throw error;
    }
  }

  private async clearDatabase() {
    this.logger.log('🗑️  Clearing existing data...');
    await this.auditLogRepository.delete({});
    await this.messageRepository.delete({});
    await this.reportRepository.delete({});
    await this.appointmentRepository.delete({});
    await this.childRepository.delete({});
    await this.serviceRepository.delete({});
    await this.userRepository.delete({});
    await this.eventRepository.delete({});
  }

  private async seedUsers(): Promise<User[]> {
    this.logger.log('👥 Seeding users...');

    const usersData = [
      // Admin
      {
        email: 'admin@crystalladder.com',
        firstName: 'John',
        lastName: 'Admin',
        password: 'Admin@123',
        role: Role.Admin,
        phone: '+1-555-0101',
        address: '123 Admin Street, City, State 12345',
        isEmailVerified: true,
        isProfileComplete: true,
        isApproved: true,
      },
      // Parent 1
      {
        email: 'parent1@example.com',
        firstName: 'David',
        lastName: 'Smith',
        password: 'Parent@123',
        role: Role.Parent,
        phone: '+1-555-0105',
        address: '654 Parent Drive, City, State 12345',
        isEmailVerified: true,
        isProfileComplete: true,
        isApproved: true,
      },
      // Parent 2
      {
        email: 'parent2@example.com',
        firstName: 'Lisa',
        lastName: 'Williams',
        password: 'Parent@123',
        role: Role.Parent,
        phone: '+1-555-0106',
        address: '987 Family Circle, City, State 12345',
        isEmailVerified: true,
        isProfileComplete: true,
        isApproved: true,
      },
      // Parent 3 (Pending approval)
      {
        email: 'parent3@example.com',
        firstName: 'Robert',
        lastName: 'Brown',
        password: 'Parent@123',
        role: Role.Parent,
        phone: '+1-555-0107',
        address: '147 New Street, City, State 12345',
        isEmailVerified: true,
        isProfileComplete: false,
        isApproved: false,
      },
    ];

    const users = [];
    for (const userData of usersData) {
      const user = this.userRepository.create(userData);
      // Manually hash password since BeforeInsert won't work in seeder
      user.password = await Helper.hashPassword(userData.password);
      const savedUser = await this.userRepository.save(user);
      users.push(savedUser);
      // Remove password from saved user for logging
      delete (savedUser as any).password;
    }

    this.logger.log(`✅ Seeded ${users.length} users`);
    return users;
  }

  private async seedChildren(users: User[]): Promise<Child[]> {
    this.logger.log('👶 Seeding children...');

    const parents = users.filter((u) => u.role === Role.Parent);
    const admin = users.find((u) => u.role === Role.Admin);

    const childrenData = [
      {
        firstName: 'Emma',
        lastName: 'Smith',
        dateOfBirth: new Date('2018-05-15'),
        gender: 'Female',
        diagnosis: 'Autism Spectrum Disorder (ASD) - Level 2',
        notes: 'Emma responds well to visual schedules and routine-based activities.',
        parentId: parents[0].id,
        therapistId: admin?.id,
      },
      {
        firstName: 'James',
        lastName: 'Smith',
        dateOfBirth: new Date('2020-03-22'),
        gender: 'Male',
        diagnosis: 'Autism Spectrum Disorder (ASD) - Level 1',
        notes: 'James is making excellent progress with speech therapy.',
        parentId: parents[0].id,
        therapistId: admin?.id,
      },
      {
        firstName: 'Olivia',
        lastName: 'Williams',
        dateOfBirth: new Date('2019-08-10'),
        gender: 'Female',
        diagnosis: 'Autism Spectrum Disorder (ASD) - Level 3',
        notes: 'Olivia requires intensive support and benefits from sensory integration therapy.',
        parentId: parents[1].id,
        therapistId: admin?.id,
      },
      {
        firstName: 'Noah',
        lastName: 'Williams',
        dateOfBirth: new Date('2021-01-30'),
        gender: 'Male',
        diagnosis: 'Autism Spectrum Disorder (ASD) - Level 2',
        notes: 'Noah is showing improvement in social communication skills.',
        parentId: parents[1].id,
        therapistId: admin?.id,
      },
    ];

    const children = [];
    for (const childData of childrenData) {
      const child = this.childRepository.create(childData);
      const savedChild = await this.childRepository.save(child);
      children.push(savedChild);
    }

    this.logger.log(`✅ Seeded ${children.length} children`);
    return children;
  }

  private async seedServices(): Promise<Service[]> {
    this.logger.log('🏥 Seeding services...');

    const servicesData = [
      {
        name: 'Speech Therapy',
        description: 'Individualized speech and language therapy sessions to improve communication skills.',
        price: 120.0,
        duration: 60,
        isActive: true,
      },
      {
        name: 'Occupational Therapy',
        description: 'Therapy focused on developing fine motor skills, sensory processing, and daily living activities.',
        price: 130.0,
        duration: 60,
        isActive: true,
      },
      {
        name: 'Applied Behavior Analysis (ABA)',
        description: 'Evidence-based therapy using principles of learning and behavior to improve social, communication, and learning skills.',
        price: 150.0,
        duration: 90,
        isActive: true,
      },
      {
        name: 'Social Skills Group',
        description: 'Group therapy sessions to develop social interaction and communication skills with peers.',
        price: 80.0,
        duration: 45,
        isActive: true,
      },
      {
        name: 'Physical Therapy',
        description: 'Therapy to improve gross motor skills, balance, coordination, and physical strength.',
        price: 140.0,
        duration: 60,
        isActive: true,
      },
      {
        name: 'Parent Training Session',
        description: 'Training sessions for parents to learn strategies and techniques to support their child at home.',
        price: 100.0,
        duration: 60,
        isActive: true,
      },
    ];

    const services = [];
    for (const serviceData of servicesData) {
      const service = this.serviceRepository.create(serviceData);
      const savedService = await this.serviceRepository.save(service);
      services.push(savedService);
    }

    this.logger.log(`✅ Seeded ${services.length} services`);
    return services;
  }

  private async seedAppointments(
    users: User[],
    children: Child[],
    services: Service[],
  ): Promise<Appointment[]> {
    this.logger.log('📅 Seeding appointments...');

    const parents = users.filter((u) => u.role === Role.Parent);
    const admin = users.find((u) => u.role === Role.Admin);

    const appointmentsData = [
      {
        appointmentDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        status: AppointmentStatus.Approved,
        notes: 'Regular weekly session',
        parentId: parents[0].id,
        childId: children[0].id,
        therapistId: admin?.id,
        serviceId: services[0].id,
      },
      {
        appointmentDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        status: AppointmentStatus.Pending,
        notes: 'Initial assessment appointment',
        parentId: parents[0].id,
        childId: children[1].id,
        therapistId: admin?.id,
        serviceId: services[1].id,
      },
      {
        appointmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: AppointmentStatus.Approved,
        notes: 'Follow-up session',
        parentId: parents[1].id,
        childId: children[2].id,
        therapistId: admin?.id,
        serviceId: services[2].id,
      },
      {
        appointmentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        status: AppointmentStatus.Completed,
        notes: 'Completed successfully',
        parentId: parents[0].id,
        childId: children[0].id,
        therapistId: admin?.id,
        serviceId: services[0].id,
      },
      {
        appointmentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        status: AppointmentStatus.Completed,
        notes: 'Good progress observed',
        parentId: parents[1].id,
        childId: children[2].id,
        therapistId: admin?.id,
        serviceId: services[2].id,
      },
      {
        appointmentDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
        status: AppointmentStatus.Pending,
        notes: 'Waiting for approval',
        parentId: parents[1].id,
        childId: children[3].id,
        serviceId: services[3].id,
      },
    ];

    const appointments = [];
    for (const appointmentData of appointmentsData) {
      const appointment = this.appointmentRepository.create(appointmentData);
      const savedAppointment = await this.appointmentRepository.save(appointment);
      appointments.push(savedAppointment);
    }

    this.logger.log(`✅ Seeded ${appointments.length} appointments`);
    return appointments;
  }

  private async seedReports(users: User[], children: Child[]): Promise<void> {
    this.logger.log('📊 Seeding reports...');

    const admin = users.find((u) => u.role === Role.Admin);

    const reportsData = [
      {
        title: 'Progress Report - January 2024',
        content: 'Emma has shown significant improvement in her communication skills. She is now using 3-word phrases consistently and has improved eye contact during sessions.',
        type: ReportType.Progress,
        metrics: {
          communicationScore: 85,
          socialSkillsScore: 78,
          behaviorScore: 90,
          improvement: '+15%',
        },
        attachments: [],
        childId: children[0].id,
        therapistId: admin?.id,
      },
      {
        title: 'Session Summary - Week 3',
        content: 'James participated well in today\'s occupational therapy session. He completed all fine motor activities and showed enthusiasm for sensory play.',
        type: ReportType.Session,
        metrics: {
          participation: 'Excellent',
          taskCompletion: '100%',
          engagement: 'High',
        },
        attachments: [],
        childId: children[1].id,
        therapistId: admin?.id,
      },
      {
        title: 'Assessment Report - Initial Evaluation',
        content: 'Olivia underwent her initial comprehensive assessment. The evaluation identified areas for intervention including communication, social skills, and sensory processing.',
        type: ReportType.Assessment,
        metrics: {
          overallScore: 65,
          strengths: ['Visual learning', 'Following routines'],
          areasForImprovement: ['Communication', 'Social interaction'],
        },
        attachments: [],
        childId: children[2].id,
        therapistId: admin?.id,
      },
      {
        title: 'Monthly Progress Update',
        content: 'Noah continues to make steady progress. His social communication has improved, and he is initiating interactions with peers more frequently.',
        type: ReportType.General,
        metrics: {
          progress: 'Positive',
          milestones: ['Increased social initiation', 'Improved turn-taking'],
        },
        attachments: [],
        childId: children[3].id,
        therapistId: admin?.id,
      },
    ];

    for (const reportData of reportsData) {
      const report = this.reportRepository.create(reportData);
      await this.reportRepository.save(report);
    }

    this.logger.log(`✅ Seeded ${reportsData.length} reports`);
  }

  private async seedMessages(users: User[]): Promise<void> {
    this.logger.log('💬 Seeding messages...');

    const admin = users.find((u) => u.role === Role.Admin);
    const parents = users.filter((u) => u.role === Role.Parent);

    const messagesData = [
      {
        subject: 'Welcome to Crystal Ladder Learning Centre',
        content: 'Welcome! We are excited to have you as part of our community. Please don\'t hesitate to reach out if you have any questions.',
        type: MessageType.Announcement,
        senderId: admin.id,
        receiverId: null,
        isRead: false,
        attachments: [],
      },
      {
        subject: 'Appointment Reminder - Tomorrow at 2 PM',
        content: 'This is a reminder that you have an appointment scheduled for tomorrow at 2:00 PM. Please arrive 10 minutes early.',
        type: MessageType.Direct,
        senderId: admin.id,
        receiverId: parents[0].id,
        isRead: false,
        attachments: [],
      },
      {
        subject: 'Monthly Newsletter - February 2024',
        content: 'Check out our latest newsletter featuring success stories, upcoming events, and helpful resources for parents.',
        type: MessageType.Newsletter,
        senderId: admin.id,
        receiverId: null,
        isRead: false,
        attachments: [],
      },
      {
        subject: 'Progress Update Available',
        content: 'A new progress report for your child is now available in the portal. Please review it at your convenience.',
        type: MessageType.Direct,
        senderId: admin.id,
        receiverId: parents[1].id,
        isRead: true,
        attachments: [],
      },
      {
        subject: 'Upcoming Workshop - Communication Strategies',
        content: 'We are hosting a free workshop for parents on effective communication strategies. Register now to secure your spot!',
        type: MessageType.Announcement,
        senderId: admin.id,
        receiverId: null,
        isRead: false,
        attachments: [],
      },
    ];

    for (const messageData of messagesData) {
      const message = this.messageRepository.create(messageData);
      await this.messageRepository.save(message);
    }

    this.logger.log(`✅ Seeded ${messagesData.length} messages`);
  }

  private async seedEvents(): Promise<void> {
    this.logger.log('📅 Seeding events...');

    const eventsData = [
      {
        title: 'Parent Workshop: Understanding Autism',
        description: 'Join us for an informative workshop where parents can learn about autism spectrum disorder, effective strategies, and available resources.',
        type: 'workshop',
        eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
        eventEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours later
        location: 'Crystal Ladder Learning Centre - Main Hall',
        images: [],
        isPublished: true,
        isFeatured: true,
      },
      {
        title: 'Family Fun Day',
        description: 'A day of fun activities for the whole family! Games, food, and entertainment for children and parents.',
        type: 'activity',
        eventDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks from now
        eventEndDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4 hours later
        location: 'Community Park',
        images: [],
        isPublished: true,
        isFeatured: true,
      },
      {
        title: 'Important Announcement: New Services Available',
        description: 'We are excited to announce new therapy services including music therapy and art therapy. Contact us for more information.',
        type: 'announcement',
        eventDate: new Date(),
        eventEndDate: null,
        location: null,
        images: [],
        isPublished: true,
        isFeatured: false,
      },
      {
        title: 'Monthly Parent Support Group Meeting',
        description: 'Monthly meeting for parents to share experiences, get support, and learn from each other.',
        type: 'meeting',
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        eventEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000), // 90 minutes later
        location: 'Crystal Ladder Learning Centre - Conference Room',
        images: [],
        isPublished: true,
        isFeatured: false,
      },
      {
        title: 'Summer Camp Registration Open',
        description: 'Registration for our summer camp program is now open! Limited spots available. Register early to secure your child\'s place.',
        type: 'announcement',
        eventDate: new Date(),
        eventEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        location: null,
        images: [],
        isPublished: true,
        isFeatured: true,
      },
    ];

    for (const eventData of eventsData) {
      const event = this.eventRepository.create(eventData);
      await this.eventRepository.save(event);
    }

    this.logger.log(`✅ Seeded ${eventsData.length} events`);
  }

  private async seedAuditLogs(users: User[]): Promise<void> {
    this.logger.log('📝 Seeding audit logs...');

    const admin = users.find((u) => u.role === Role.Admin);

    const auditLogsData = [
      {
        action: AuditAction.Login,
        entity: 'user',
        entityId: admin.id,
        description: 'Admin logged into the system',
        changes: {},
        userId: admin.id,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      {
        action: AuditAction.Create,
        entity: 'child',
        entityId: 1,
        description: 'Admin created a new child record',
        changes: { childId: 1 },
        userId: admin.id,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      {
        action: AuditAction.Approve,
        entity: 'appointment',
        entityId: 1,
        description: 'Admin approved an appointment',
        changes: { status: 'approved' },
        userId: admin.id,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      {
        action: AuditAction.Update,
        entity: 'user',
        entityId: 2,
        description: 'Admin updated user profile',
        changes: { isApproved: true },
        userId: admin.id,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      {
        action: AuditAction.View,
        entity: 'report',
        entityId: 1,
        description: 'Admin viewed a report',
        changes: {},
        userId: admin.id,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    ];

    for (const auditLogData of auditLogsData) {
      const auditLog = this.auditLogRepository.create(auditLogData);
      await this.auditLogRepository.save(auditLog);
    }

    this.logger.log(`✅ Seeded ${auditLogsData.length} audit logs`);
  }
}

