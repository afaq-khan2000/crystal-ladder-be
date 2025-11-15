import { Entity, Column } from 'typeorm';
import Model from './base.entity';

@Entity('events')
export class Event extends Model {
  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'varchar',
    length: 100,
    default: 'announcement',
  })
  type: string;

  @Column({ name: 'event_date', type: 'timestamp' })
  eventDate: Date;

  @Column({ name: 'event_end_date', type: 'timestamp', nullable: true })
  eventEndDate: Date;

  @Column({ type: 'varchar', length: 200, nullable: true })
  location: string;

  @Column({ type: 'json', nullable: true, comment: 'Image URLs array' })
  images: string[];

  @Column({ type: 'boolean', default: true })
  isPublished: boolean;

  @Column({ type: 'boolean', default: false })
  isFeatured: boolean;
}

