import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { JwtAuthGuard } from '../auth/guards/local-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/common/enums/roles.enum';
import { ApiSecurityAuth } from '@/common/decorators/swagger.decorator';
import { MessageType } from '@/entities/message.entity';

@Controller('messages')
@ApiTags('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiSecurityAuth()
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * Create a new message
   * All authenticated users can send messages
   */
  @Post()
  @ApiOperation({ summary: 'Create a new message' })
  @ApiResponse({ status: 201, description: 'Message created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() createMessageDto: CreateMessageDto, @Request() req) {
    return this.messagesService.create(createMessageDto, req.user.id);
  }

  /**
   * Get all messages (paginated)
   * Filtered by user role
   */
  @Get()
  @ApiOperation({ summary: 'Get all messages (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: MessageType,
  })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of messages' })
  findAll(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: MessageType,
    @Query('isRead') isRead?: string,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const isReadFilter = isRead === 'true' ? true : isRead === 'false' ? false : undefined;

    return this.messagesService.findAll(
      pageNum,
      limitNum,
      req.user.id,
      req.user.role,
      type,
      isReadFilter,
    );
  }

  /**
   * Get a specific message by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a message by ID' })
  @ApiResponse({ status: 200, description: 'Message details' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.messagesService.findOne(
      parseInt(id),
      req.user.id,
      req.user.role,
    );
  }

  /**
   * Update a message (mark as read, etc.)
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update a message' })
  @ApiResponse({ status: 200, description: 'Message updated successfully' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(
    @Param('id') id: string,
    @Body() updateMessageDto: UpdateMessageDto,
    @Request() req,
  ) {
    return this.messagesService.update(
      parseInt(id),
      updateMessageDto,
      req.user.id,
      req.user.role,
    );
  }

  /**
   * Mark message as read
   */
  @Put(':id/read')
  @ApiOperation({ summary: 'Mark message as read' })
  @ApiResponse({ status: 200, description: 'Message marked as read' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  markAsRead(@Param('id') id: string, @Request() req) {
    return this.messagesService.markAsRead(parseInt(id), req.user.id);
  }

  /**
   * Delete a message (soft delete)
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiResponse({ status: 200, description: 'Message deleted successfully' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Param('id') id: string, @Request() req) {
    return this.messagesService.remove(
      parseInt(id),
      req.user.id,
      req.user.role,
    );
  }
}

