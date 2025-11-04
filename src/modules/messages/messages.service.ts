import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, MessageType } from '@/entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { Helper } from '@/utils';
import { User } from '@/entities/user.entity';
import { Role } from '@/common/enums/roles.enum';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Create a new message
   * @param createMessageDto - Message data
   * @param senderId - Sender user ID
   * @returns Created message
   */
  async create(
    createMessageDto: CreateMessageDto,
    senderId: number,
  ): Promise<Message> {
    // Verify receiver if provided (for direct messages)
    if (
      createMessageDto.type === MessageType.Direct &&
      createMessageDto.receiverId
    ) {
      const receiver = await this.userRepository.findOne({
        where: { id: createMessageDto.receiverId },
      });

      if (!receiver) {
        throw new HttpException('Receiver not found', HttpStatus.NOT_FOUND);
      }
    }

    const message = this.messageRepository.create({
      ...createMessageDto,
      senderId,
      type: createMessageDto.type || MessageType.Direct,
    });

    return await this.messageRepository.save(message);
  }

  /**
   * Find all messages (paginated)
   * @param page - Page number
   * @param limit - Items per page
   * @param userId - User ID (for filtering)
   * @param userRole - User role (for filtering)
   * @param type - Filter by message type
   * @param isRead - Filter by read status
   * @returns Paginated list of messages
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    userId?: number,
    userRole?: Role,
    type?: MessageType,
    isRead?: boolean,
  ) {
    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    // Parents can see messages sent to them or announcements/newsletters
    if (userRole === Role.Parent) {
      where.receiverId = userId;
      // Also include announcements and newsletters
      if (type === MessageType.Announcement || type === MessageType.Newsletter) {
        delete where.receiverId;
      }
    }

    // Therapists and admins can see all messages
    if ([Role.Therapist, Role.Admin, Role.ContentManager].includes(userRole)) {
      // Filter by sent or received
      where.senderId = userId;
      // Or get received messages
      const receivedWhere = { ...where };
      delete receivedWhere.senderId;
      receivedWhere.receiverId = userId;
    }

    const [messages, total] = await this.messageRepository.findAndCount({
      where,
      relations: ['sender', 'receiver'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return Helper.paginateResponse({ data: [messages, total], page, limit });
  }

  /**
   * Find one message by ID
   * @param id - Message ID
   * @param userId - User ID (for authorization check)
   * @param userRole - User role (for authorization check)
   * @returns Message record
   */
  async findOne(
    id: number,
    userId?: number,
    userRole?: Role,
  ): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id },
      relations: ['sender', 'receiver'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Check authorization
    if (
      message.receiverId !== userId &&
      message.senderId !== userId &&
      !['Admin', 'ContentManager'].includes(userRole)
    ) {
      throw new HttpException('Unauthorized access', HttpStatus.FORBIDDEN);
    }

    return message;
  }

  /**
   * Update message (mark as read, etc.)
   * @param id - Message ID
   * @param updateMessageDto - Updated message data
   * @param userId - User ID (for authorization check)
   * @param userRole - User role (for authorization check)
   * @returns Updated message
   */
  async update(
    id: number,
    updateMessageDto: UpdateMessageDto,
    userId?: number,
    userRole?: Role,
  ): Promise<Message> {
    const message = await this.findOne(id, userId, userRole);

    // Only receiver can mark as read
    if (updateMessageDto.isRead && message.receiverId !== userId) {
      throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
    }

    Object.assign(message, updateMessageDto);
    return await this.messageRepository.save(message);
  }

  /**
   * Remove message (soft delete)
   * @param id - Message ID
   * @param userId - User ID (for authorization check)
   * @param userRole - User role (for authorization check)
   */
  async remove(
    id: number,
    userId?: number,
    userRole?: Role,
  ): Promise<void> {
    const message = await this.findOne(id, userId, userRole);

    // Only sender or admin can delete
    if (message.senderId !== userId && userRole !== Role.Admin) {
      throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
    }

    await this.messageRepository.softRemove(message);
  }

  /**
   * Mark message as read
   * @param id - Message ID
   * @param userId - User ID
   */
  async markAsRead(id: number, userId: number): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id, receiverId: userId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    message.isRead = true;
    return await this.messageRepository.save(message);
  }
}

