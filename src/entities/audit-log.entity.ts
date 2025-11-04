import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import Model from './base.entity';
import { User } from './user.entity';

export enum AuditAction {
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
  Approve = 'approve',
  Reject = 'reject',
  Login = 'login',
  Logout = 'logout',
  View = 'view',
  Export = 'export',
}

@Entity('audit_logs')
export class AuditLog extends Model {
  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @Column({ type: 'varchar', length: 100 })
  entity: string;

  @Column({ name: 'entity_id', type: 'int', nullable: true })
  entityId: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true, comment: 'Stores old and new values' })
  changes: Record<string, unknown>;

  @Column({ name: 'ip_address', type: 'varchar', length: 50, nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @ManyToOne(() => User, (user) => user.auditLogs)
  @JoinColumn({ name: 'user_id' })
  user: User;
}

