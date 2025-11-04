import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import Model from './base.entity';
import { User } from './user.entity';

export enum MessageType {
  Direct = 'direct',
  Announcement = 'announcement',
  Newsletter = 'newsletter',
}

@Entity('messages')
export class Message extends Model {
  @Column({ type: 'varchar', length: 200 })
  subject: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.Direct,
  })
  type: MessageType;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ name: 'sender_id', type: 'int' })
  senderId: number;

  @Column({ name: 'receiver_id', type: 'int', nullable: true })
  receiverId: number;

  @Column({ type: 'json', nullable: true, comment: 'Attachment URLs array' })
  attachments: string[];

  @ManyToOne(() => User, (user) => user.sentMessages)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @ManyToOne(() => User, (user) => user.receivedMessages, { nullable: true })
  @JoinColumn({ name: 'receiver_id' })
  receiver: User;
}

