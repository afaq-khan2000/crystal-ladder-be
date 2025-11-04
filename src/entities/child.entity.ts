import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import Model from './base.entity';
import { User } from './user.entity';
import { Appointment } from './appointment.entity';
import { Report } from './report.entity';

@Entity('children')
export class Child extends Model {
  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ type: 'varchar', length: 10, nullable: true })
  gender: string;

  @Column({ type: 'text', nullable: true })
  diagnosis: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'profile_image', type: 'varchar', length: 500, nullable: true })
  profileImage: string;

  @Column({ name: 'parent_id', type: 'int' })
  parentId: number;

  @Column({ name: 'therapist_id', type: 'int', nullable: true })
  therapistId: number;

  @ManyToOne(() => User, (user) => user.children)
  @JoinColumn({ name: 'parent_id' })
  parent: User;

  @ManyToOne(() => User, (user) => user.therapistAppointments, { nullable: true })
  @JoinColumn({ name: 'therapist_id' })
  therapist: User;

  @OneToMany(() => Appointment, (appointment) => appointment.child)
  appointments: Appointment[];

  @OneToMany(() => Report, (report) => report.child)
  reports: Report[];
}

