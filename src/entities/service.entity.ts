import { Entity, Column, OneToMany } from 'typeorm';
import Model from './base.entity';
import { Appointment } from './appointment.entity';

@Entity('services')
export class Service extends Model {
  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @Column({ type: 'int', default: 60, comment: 'Duration in minutes' })
  duration: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => Appointment, (appointment) => appointment.service)
  appointments: Appointment[];
}

