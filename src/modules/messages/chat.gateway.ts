import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { TypingIndicatorDto } from './dto/typing-indicator.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { Role } from '@/common/enums/roles.enum';

interface AuthenticatedSocket extends Socket {
  user?: {
    id: number;
    email: string;
    role: Role;
  };
}

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedUsers = new Map<number, string>(); // userId -> socketId

  constructor(private readonly messagesService: MessagesService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract user from socket handshake (you should implement proper JWT validation)
      const userId = parseInt(client.handshake.query.userId as string);
      const userRole = client.handshake.query.userRole as Role;

      if (!userId || !userRole) {
        this.logger.warn('Connection rejected: Missing userId or userRole');
        client.disconnect();
        return;
      }

      client.user = {
        id: userId,
        email: '',
        role: userRole,
      };

      // Store connected user
      this.connectedUsers.set(userId, client.id);

      // Join user-specific room
      const roomName = `room-${userId}`;
      await client.join(roomName);

      // If admin, join all rooms (you might want to optimize this)
      if (userRole === Role.Admin) {
        // Admin can listen to all user rooms
        this.logger.log(`Admin ${userId} connected`);
      }

      this.logger.log(
        `User ${userId} (${userRole}) connected. Socket: ${client.id}`,
      );

      // Notify admin about user connection
      if (userRole === Role.Parent) {
        this.server.emit('user_connected', {
          userId,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.user) {
      this.connectedUsers.delete(client.user.id);
      this.logger.log(`User ${client.user.id} disconnected`);

      // Notify admin about user disconnection
      if (client.user.role === Role.Parent) {
        this.server.emit('user_disconnected', {
          userId: client.user.id,
          timestamp: new Date(),
        });
      }
    }
  }

  /**
   * User sends message to admin
   */
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: SendMessageDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.user) {
        return { error: 'Unauthorized' };
      }

      const { content, attachments } = data;
      const senderId = client.user.id;
      const senderRole = client.user.role;

      // Parents can only send to admin (receiverId will be determined by admin users)
      // For now, we'll save with receiverId as null and admin will receive it
      let receiverId: number | null = null;

      if (senderRole === Role.Admin && data.receiverId) {
        // Admin sending to specific user
        receiverId = data.receiverId;
      }

      // Save message to database
      const message = await this.messagesService.createChatMessage({
        content,
        attachments: attachments || [],
        senderId,
        receiverId,
      });

      // Emit to appropriate room
      if (senderRole === Role.Parent) {
        // Notify all admins
        this.server.emit('new_message', {
          message,
          senderId,
          senderRole,
        });
      } else if (senderRole === Role.Admin && receiverId) {
        // Notify specific user
        this.server.to(`room-${receiverId}`).emit('admin_send_message', {
          message,
          senderId,
        });

        // Also send back to admin for confirmation
        client.emit('message_sent', {
          message,
          status: 'delivered',
        });
      }

      return { success: true, message };
    } catch (error) {
      this.logger.error('Error sending message:', error);
      return { error: 'Failed to send message' };
    }
  }

  /**
   * Admin sends message to user
   */
  @SubscribeMessage('admin_send_message')
  async handleAdminSendMessage(
    @MessageBody() data: SendMessageDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.user || client.user.role !== Role.Admin) {
        return { error: 'Unauthorized' };
      }

      if (!data.receiverId) {
        return { error: 'Receiver ID is required' };
      }

      const message = await this.messagesService.createChatMessage({
        content: data.content,
        attachments: data.attachments || [],
        senderId: client.user.id,
        receiverId: data.receiverId,
      });

      // Send to specific user
      this.server.to(`room-${data.receiverId}`).emit('new_message', {
        message,
        senderId: client.user.id,
        senderRole: Role.Admin,
      });

      return { success: true, message };
    } catch (error) {
      this.logger.error('Error sending admin message:', error);
      return { error: 'Failed to send message' };
    }
  }

  /**
   * Mark message as read
   */
  @SubscribeMessage('message_read')
  async handleMessageRead(
    @MessageBody() data: MarkReadDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.user) {
        return { error: 'Unauthorized' };
      }

      const message = await this.messagesService.markMessageAsRead(
        data.messageId,
        client.user.id,
      );

      // Notify sender about read receipt
      if (message.senderId) {
        this.server.to(`room-${message.senderId}`).emit('message_read_receipt', {
          messageId: message.id,
          readBy: client.user.id,
          readAt: message.readAt,
        });
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Error marking message as read:', error);
      return { error: 'Failed to mark as read' };
    }
  }

  /**
   * User typing indicator
   */
  @SubscribeMessage('typing_start')
  async handleTypingStart(
    @MessageBody() data: TypingIndicatorDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.user) return;

    if (client.user.role === Role.Parent) {
      // Notify all admins
      this.server.emit('user_typing', {
        userId: client.user.id,
        isTyping: true,
      });
    } else if (client.user.role === Role.Admin && data.receiverId) {
      // Notify specific user
      this.server.to(`room-${data.receiverId}`).emit('admin_typing_start', {
        adminId: client.user.id,
      });
    }
  }

  /**
   * User stopped typing
   */
  @SubscribeMessage('typing_stop')
  async handleTypingStop(
    @MessageBody() data: TypingIndicatorDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.user) return;

    if (client.user.role === Role.Parent) {
      // Notify all admins
      this.server.emit('user_typing', {
        userId: client.user.id,
        isTyping: false,
      });
    } else if (client.user.role === Role.Admin && data.receiverId) {
      // Notify specific user
      this.server.to(`room-${data.receiverId}`).emit('admin_typing_stop', {
        adminId: client.user.id,
      });
    }
  }

  /**
   * Get unread count for a user
   */
  @SubscribeMessage('get_unread_count')
  async handleGetUnreadCount(@ConnectedSocket() client: AuthenticatedSocket) {
    try {
      if (!client.user) {
        return { error: 'Unauthorized' };
      }

      const unreadCount = await this.messagesService.getUnreadCount(
        client.user.id,
        client.user.role,
      );

      return { success: true, unreadCount };
    } catch (error) {
      this.logger.error('Error getting unread count:', error);
      return { error: 'Failed to get unread count' };
    }
  }

  /**
   * Admin gets unread counts for all users
   */
  @SubscribeMessage('get_all_unread_counts')
  async handleGetAllUnreadCounts(
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.user || client.user.role !== Role.Admin) {
        return { error: 'Unauthorized' };
      }

      const unreadCounts =
        await this.messagesService.getUnreadCountsByUsers();

      return { success: true, unreadCounts };
    } catch (error) {
      this.logger.error('Error getting all unread counts:', error);
      return { error: 'Failed to get unread counts' };
    }
  }

  /**
   * Emit unread count to specific user
   */
  async emitUnreadCount(userId: number, count: number) {
    this.server.to(`room-${userId}`).emit('unread_count', {
      count,
      timestamp: new Date(),
    });
  }

  /**
   * Emit message deleted event
   */
  async emitMessageDeleted(messageId: number, userIds: number[]) {
    userIds.forEach((userId) => {
      this.server.to(`room-${userId}`).emit('message_deleted', {
        messageId,
        timestamp: new Date(),
      });
    });
  }
}

