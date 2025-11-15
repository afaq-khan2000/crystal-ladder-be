import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { PublicService } from './public.service';
import { BookAppointmentDto } from '../appointments/dto/book-appointment.dto';

@Controller('public')
@ApiTags('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  /**
   * Get all services (public - no authentication required)
   */
  @Get('services')
  @ApiOperation({ summary: 'Get all services (public)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'all', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of services' })
  getServices(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isActive') isActive?: string,
    @Query('all') all?: string,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const isActiveFilter =
      isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    const fetchAll = all === 'true';

    return this.publicService.getServices(
      pageNum,
      limitNum,
      isActiveFilter,
      fetchAll,
    );
  }

  /**
   * Get a specific service by ID (public)
   */
  @Get('services/:id')
  @ApiOperation({ summary: 'Get a service by ID (public)' })
  @ApiResponse({ status: 200, description: 'Service details' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  getService(@Param('id') id: string) {
    return this.publicService.getService(parseInt(id));
  }

  /**
   * Get all published events (public - no authentication required)
   */
  @Get('events')
  @ApiOperation({ summary: 'Get all published events (public)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'isFeatured', required: false, type: Boolean })
  @ApiQuery({
    name: 'type',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'all',
    required: false,
    type: Boolean,
    description: 'When true, include unpublished events',
  })
  @ApiResponse({ status: 200, description: 'List of events' })
  getEvents(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('type') type?: string,
    @Query('all') all?: string,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const isFeaturedFilter =
      isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined;
    const includeAll = all === 'true';

    return this.publicService.getEvents(
      pageNum,
      limitNum,
      includeAll,
      isFeaturedFilter,
      type,
    );
  }

  /**
   * Get a specific event by ID (public)
   */
  @Get('events/:id')
  @ApiOperation({ summary: 'Get an event by ID (public)' })
  @ApiResponse({ status: 200, description: 'Event details' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  getEvent(@Param('id') id: string) {
    return this.publicService.getEvent(parseInt(id));
  }

  /**
   * Get published FAQs (public)
   */
  @Get('faqs')
  @ApiOperation({ summary: 'Get published FAQs (public)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'all',
    required: false,
    type: Boolean,
    description: 'When true, return all FAQs (ignores published filter)',
  })
  @ApiResponse({ status: 200, description: 'List of FAQs' })
  getFaqs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('all') all?: string,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const fetchAll = all === 'true';
    return this.publicService.getFaqs(pageNum, limitNum, fetchAll);
  }

  /**
   * Get a published FAQ by ID (public)
   */
  @Get('faqs/:id')
  @ApiOperation({ summary: 'Get a published FAQ by ID (public)' })
  @ApiResponse({ status: 200, description: 'FAQ details' })
  @ApiResponse({ status: 404, description: 'FAQ not found' })
  getFaq(@Param('id') id: string) {
    return this.publicService.getFaq(parseInt(id));
  }

  /**
   * Book an appointment (public - no authentication required)
   */
  @Post('appointments/book')
  @ApiOperation({ summary: 'Book an appointment (public)' })
  @ApiResponse({
    status: 201,
    description: 'Appointment booked successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Registration required - parent not found',
  })
  @ApiResponse({
    status: 404,
    description: 'Service not found',
  })
  bookAppointment(@Body() bookAppointmentDto: BookAppointmentDto) {
    return this.publicService.bookAppointment(bookAppointmentDto);
  }
}

