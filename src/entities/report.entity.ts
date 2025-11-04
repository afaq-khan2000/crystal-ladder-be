import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import Model from './base.entity';
import { User } from './user.entity';
import { Child } from './child.entity';

export enum ReportType {
  Progress = 'progress',
  Session = 'session',
  Assessment = 'assessment',
  General = 'general',
}

@Entity('reports')
export class Report extends Model {
  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: ReportType,
    default: ReportType.General,
  })
  type: ReportType;

  @Column({ type: 'json', nullable: true, comment: 'Stores chart data or metrics' })
  metrics: Record<string, unknown>;

  @Column({ type: 'json', nullable: true, comment: 'Attachment URLs array' })
  attachments: string[];

  @Column({ name: 'child_id', type: 'int' })
  childId: number;

  @Column({ name: 'therapist_id', type: 'int' })
  therapistId: number;

  @ManyToOne(() => Child, (child) => child.reports)
  @JoinColumn({ name: 'child_id' })
  child: Child;

  @ManyToOne(() => User, (user) => user.reports)
  @JoinColumn({ name: 'therapist_id' })
  therapist: User;
}

