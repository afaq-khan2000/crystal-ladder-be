import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { GetChatHistoryDto } from './dto/get-chat-history.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/local-auth.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/common/enums/roles.enum';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';

@ApiTags('Messages')
@ApiBearerAuth()
@Controller('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * Get chat history
   * For parents: returns their chat with admin
   * For admin: returns chat with specific user (if userId provided) or all messages
   */
  @Get('chat-history')
  @ApiOperation({ summary: 'Get chat history' })
  @ApiResponse({
    status: 200,
    description: 'Chat history retrieved successfully',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: Number,
    description: 'For admin: get chat with specific user',
  })
  async getChatHistory(@Request() req: any, @Query() query: GetChatHistoryDto) {
    const user = req.user;
    const { page = 1, limit = 50, userId } = query;

    return await this.messagesService.getChatHistory(
      user.id,
      user.role,
      page,
      limit,
      userId,
    );
  }

  /**
   * Send a message via REST API
   * For parents: sends message to admin
   * For admin: must specify receiverId
   */
  @Post('send')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a message (REST API alternative)' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  async sendMessage(@Request() req: any, @Body() sendMessageDto: SendMessageDto) {
    const user = req.user;

    // Validate receiverId for admin
    if (user.role === Role.Admin && !sendMessageDto.receiverId) {
      throw new Error('Admin must specify receiverId');
    }

    const message = await this.messagesService.createChatMessage({
      content: sendMessageDto.content,
      senderId: user.id,
      receiverId: sendMessageDto.receiverId || null,
      attachments: sendMessageDto.attachments || [],
    });

    return {
      success: true,
      message: 'Message sent successfully',
      data: message,
    };
  }

  /**
   * Get unread message count
   */
  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread message count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
  async getUnreadCount(@Request() req: any) {
    const user = req.user;
    const unreadCount = await this.messagesService.getUnreadCount(
      user.id,
      user.role,
    );

    return {
      success: true,
      data: { unreadCount },
    };
  }

  /**
   * Get unread counts for all users (Admin only)
   */
  @Get('unread-counts-by-users')
  @Roles(Role.Admin)
  @ApiOperation({
    summary: 'Get unread counts grouped by users (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Unread counts retrieved successfully',
  })
  async getUnreadCountsByUsers() {
    const unreadCounts = await this.messagesService.getUnreadCountsByUsers();

    return {
      success: true,
      data: unreadCounts,
    };
  }

  /**
   * Mark message as read
   */
  @Post('mark-read/:messageId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark message as read' })
  @ApiResponse({ status: 200, description: 'Message marked as read' })
  async markAsRead(
    @Request() req: any,
    @Param('messageId', ParseIntPipe) messageId: number,
  ) {
    const user = req.user;
    const message = await this.messagesService.markMessageAsRead(
      messageId,
      user.id,
    );

    return {
      success: true,
      message: 'Message marked as read',
      data: message,
    };
  }

  /**
   * Delete a single message
   */
  @Delete(':messageId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a single message' })
  @ApiResponse({ status: 200, description: 'Message deleted successfully' })
  async deleteMessage(
    @Request() req: any,
    @Param('messageId', ParseIntPipe) messageId: number,
  ) {
    const user = req.user;
    await this.messagesService.deleteMessage(messageId, user.id, user.role);

    return {
      success: true,
      message: 'Message deleted successfully',
    };
  }

  /**
   * Delete chat history
   * For parents: deletes their entire chat with admin
   * For admin: must specify userId to delete chat with specific user
   */
  @Delete('chat-history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete chat history' })
  @ApiResponse({ status: 200, description: 'Chat history deleted successfully' })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: Number,
    description: 'For admin: delete chat with specific user',
  })
  async deleteChatHistory(
    @Request() req: any,
    @Query('userId', ParseIntPipe) userId?: number,
  ) {
    const user = req.user;
    await this.messagesService.deleteChatHistory(user.id, user.role, userId);

    return {
      success: true,
      message: 'Chat history deleted successfully',
    };
  }

  /**
   * Get all messages (Admin only - for announcements, newsletters, etc.)
   */
  @Get('all')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Get all messages (Admin only)' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAllMessages(
    @Request() req: any,
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 10,
  ) {
    const user = req.user;
    return await this.messagesService.findAll(
      page,
      limit,
      user.id,
      user.role,
    );
  }
}

