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
      // Also include announcements and newsletters (no receiverId filter)
      if (type === MessageType.Announcement || type === MessageType.Newsletter) {
        delete where.receiverId;
      }
    }

    // Admins can see all messages (no filter applied to where clause)
    // If no role is provided or role is Admin, don't filter by userId

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
      userRole !== Role.Admin
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

  /**
   * Create a chat message (for real-time chat)
   * @param data - Message data
   * @returns Created message
   */
  async createChatMessage(data: {
    content: string;
    senderId: number;
    receiverId?: number | null;
    attachments?: string[];
  }): Promise<Message> {
    const message = this.messageRepository.create({
      content: data.content,
      senderId: data.senderId,
      receiverId: data.receiverId,
      attachments: data.attachments || [],
      type: MessageType.Direct,
      isRead: false,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Load relations
    return await this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender', 'receiver'],
    });
  }

  /**
   * Get chat history between user and admin
   * @param userId - User ID
   * @param userRole - User role
   * @param page - Page number
   * @param limit - Items per page
   * @param withUserId - For admin: get chat with specific user
   * @returns Paginated chat history
   */
  async getChatHistory(
    userId: number,
    userRole: Role,
    page: number = 1,
    limit: number = 50,
    withUserId?: number,
  ) {
    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.receiver', 'receiver')
      .where('message.type = :type', { type: MessageType.Direct })
      .orderBy('message.createdAt', 'DESC');

    if (userRole === Role.Parent) {
      // Parent can only see their own messages
      queryBuilder.andWhere(
        '(message.senderId = :userId OR message.receiverId = :userId)',
        { userId },
      );
    } else if (userRole === Role.Admin && withUserId) {
      // Admin viewing chat with specific user
      queryBuilder.andWhere(
        '((message.senderId = :adminId AND message.receiverId = :withUserId) OR (message.senderId = :withUserId AND message.receiverId = :adminId))',
        { adminId: userId, withUserId },
      );
    } else if (userRole === Role.Admin && !withUserId) {
      // Admin viewing all messages
      // No additional filter needed
    }

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [messages, total] = await queryBuilder.getManyAndCount();

    return Helper.paginateResponse({
      data: [messages, total],
      page,
      limit,
    });
  }

  /**
   * Get unread count for a user
   * @param userId - User ID
   * @param userRole - User role
   * @returns Unread message count
   */
  async getUnreadCount(userId: number, userRole: Role): Promise<number> {
    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .where('message.isRead = :isRead', { isRead: false })
      .andWhere('message.type = :type', { type: MessageType.Direct });

    if (userRole === Role.Parent) {
      // Count messages sent to this user
      queryBuilder.andWhere('message.receiverId = :userId', { userId });
    } else if (userRole === Role.Admin) {
      // Count messages sent to admin (receiverId is null or admin's ID)
      queryBuilder.andWhere(
        '(message.receiverId = :userId OR message.receiverId IS NULL)',
        { userId },
      );
    }

    return await queryBuilder.getCount();
  }

  /**
   * Get unread counts grouped by users (for admin)
   * @returns Array of user IDs with their unread counts
   */
  async getUnreadCountsByUsers(): Promise<
    Array<{ userId: number; unreadCount: number; user: User }>
  > {
    const unreadMessages = await this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .where('message.isRead = :isRead', { isRead: false })
      .andWhere('message.type = :type', { type: MessageType.Direct })
      .andWhere('sender.role = :role', { role: Role.Parent })
      .getMany();

    // Group by sender
    const grouped = unreadMessages.reduce(
      (acc, message) => {
        if (!acc[message.senderId]) {
          acc[message.senderId] = {
            userId: message.senderId,
            unreadCount: 0,
            user: message.sender,
          };
        }
        acc[message.senderId].unreadCount++;
        return acc;
      },
      {} as Record<
        number,
        { userId: number; unreadCount: number; user: User }
      >,
    );

    return Object.values(grouped);
  }

  /**
   * Mark message as read (for chat)
   * @param messageId - Message ID
   * @param userId - User ID
   * @returns Updated message
   */
  async markMessageAsRead(messageId: number, userId: number): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Only receiver can mark as read
    if (message.receiverId !== userId) {
      throw new HttpException(
        'Only receiver can mark message as read',
        HttpStatus.FORBIDDEN,
      );
    }

    message.isRead = true;
    message.readAt = new Date();

    return await this.messageRepository.save(message);
  }

  /**
   * Delete chat history (soft delete)
   * @param userId - User ID
   * @param userRole - User role
   * @param withUserId - For admin: delete chat with specific user
   */
  async deleteChatHistory(
    userId: number,
    userRole: Role,
    withUserId?: number,
  ): Promise<void> {
    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .where('message.type = :type', { type: MessageType.Direct });

    if (userRole === Role.Parent) {
      // Parent can only delete their own messages
      queryBuilder.andWhere(
        '(message.senderId = :userId OR message.receiverId = :userId)',
        { userId },
      );
    } else if (userRole === Role.Admin && withUserId) {
      // Admin deleting chat with specific user
      queryBuilder.andWhere(
        '((message.senderId = :adminId AND message.receiverId = :withUserId) OR (message.senderId = :withUserId AND message.receiverId = :adminId))',
        { adminId: userId, withUserId },
      );
    } else if (userRole === Role.Admin && !withUserId) {
      // Admin cannot delete all messages without specifying user
      throw new HttpException(
        'Please specify userId to delete chat history',
        HttpStatus.BAD_REQUEST,
      );
    }

    const messages = await queryBuilder.getMany();

    if (messages.length > 0) {
      await this.messageRepository.softRemove(messages);
    }
  }

  /**
   * Delete a single message
   * @param messageId - Message ID
   * @param userId - User ID
   * @param userRole - User role
   */
  async deleteMessage(
    messageId: number,
    userId: number,
    userRole: Role,
  ): Promise<void> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Only sender or admin can delete
    if (message.senderId !== userId && userRole !== Role.Admin) {
      throw new HttpException(
        'Only sender or admin can delete message',
        HttpStatus.FORBIDDEN,
      );
    }

    await this.messageRepository.softRemove(message);
  }
}

