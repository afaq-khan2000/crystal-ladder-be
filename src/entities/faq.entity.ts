import { Entity, Column } from 'typeorm';
import Model from './base.entity';

@Entity('faqs')
export class Faq extends Model {
  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'boolean', default: true })
  isPublished: boolean;
}


