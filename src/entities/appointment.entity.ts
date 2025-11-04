import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import Model from './base.entity';
import { User } from './user.entity';
import { Child } from './child.entity';
import { Service } from './service.entity';

export enum AppointmentStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

@Entity('appointments')
export class Appointment extends Model {
  @Column({ name: 'appointment_date', type: 'timestamp' })
  appointmentDate: Date;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.Pending,
  })
  status: AppointmentStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  cancellationReason: string;

  @Column({ name: 'parent_id', type: 'int' })
  parentId: number;

  @Column({ name: 'child_id', type: 'int' })
  childId: number;

  @Column({ name: 'therapist_id', type: 'int', nullable: true })
  therapistId: number;

  @Column({ name: 'service_id', type: 'int' })
  serviceId: number;

  @ManyToOne(() => User, (user) => user.appointments)
  @JoinColumn({ name: 'parent_id' })
  parent: User;

  @ManyToOne(() => User, (user) => user.therapistAppointments, { nullable: true })
  @JoinColumn({ name: 'therapist_id' })
  therapist: User;

  @ManyToOne(() => Child, (child) => child.appointments)
  @JoinColumn({ name: 'child_id' })
  child: Child;

  @ManyToOne(() => Service, (service) => service.appointments)
  @JoinColumn({ name: 'service_id' })
  service: Service;
}

