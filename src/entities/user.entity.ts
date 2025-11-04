import { Helper } from '@/utils';
import { Entity, Column, BeforeInsert, OneToMany } from 'typeorm';
import Model from './base.entity';
import { Role } from '@/common/enums/roles.enum';
import { Child } from './child.entity';
import { Appointment } from './appointment.entity';
import { Message } from './message.entity';
import { Report } from './report.entity';
import { AuditLog } from './audit-log.entity';

@Entity('users')
export class User extends Model {
  @Column({ unique: true, type: 'varchar', length: 255 })
  email: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.Parent,
  })
  role: Role;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ name: 'otp_code', nullable: true, type: 'varchar', length: 6 })
  otpCode: string;

  @Column({ name: 'is_email_verified', type: 'boolean', default: false })
  isEmailVerified: boolean;

  @Column({ name: 'is_password_forget', type: 'boolean', default: false })
  isPasswordForget: boolean;

  @Column({ name: 'is_profile_complete', type: 'boolean', default: false })
  isProfileComplete: boolean;

  @Column({ name: 'is_approved', type: 'boolean', default: false })
  isApproved: boolean;

  @Column({ name: 'profile_image', type: 'varchar', length: 500, nullable: true })
  profileImage: string;

  // Relations
  @OneToMany(() => Child, (child) => child.parent)
  children: Child[];

  @OneToMany(() => Appointment, (appointment) => appointment.parent)
  appointments: Appointment[];

  @OneToMany(() => Appointment, (appointment) => appointment.therapist)
  therapistAppointments: Appointment[];

  @OneToMany(() => Message, (message) => message.sender)
  sentMessages: Message[];

  @OneToMany(() => Message, (message) => message.receiver)
  receivedMessages: Message[];

  @OneToMany(() => Report, (report) => report.therapist)
  reports: Report[];

  @OneToMany(() => AuditLog, (auditLog) => auditLog.user)
  auditLogs: AuditLog[];

  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      this.password = await Helper.hashPassword(this.password);
    }
  }
}
