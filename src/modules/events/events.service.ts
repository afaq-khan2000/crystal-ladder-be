import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '@/entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Helper } from '@/utils';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
  ) {}

  /**
   * Create a new event
   * @param createEventDto - Event data
   * @returns Created event
   */
  async create(createEventDto: CreateEventDto): Promise<Event> {
    const event = this.eventRepository.create({
      ...createEventDto,
      isPublished: createEventDto.isPublished !== undefined ? createEventDto.isPublished : true,
      isFeatured: createEventDto.isFeatured || false,
    });

    return await this.eventRepository.save(event);
  }

  /**
   * Find all events (paginated)
   * @param page - Page number
   * @param limit - Items per page
   * @param isPublished - Filter by published status
   * @param isFeatured - Filter by featured status
   * @param type - Filter by event type
   * @returns Paginated list of events
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    isPublished?: boolean,
    isFeatured?: boolean,
    type?: string,
  ) {
    const where: any = {};

    if (isPublished !== undefined) {
      where.isPublished = isPublished;
    }

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    if (type) {
      where.type = type;
    }

    const [events, total] = await this.eventRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { eventDate: 'ASC' },
    });

    return Helper.paginateResponse({ data: [events, total], page, limit });
  }

  /**
   * Find one event by ID
   * @param id - Event ID
   * @returns Event record
   */
  async findOne(id: number): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  /**
   * Update event record
   * @param id - Event ID
   * @param updateEventDto - Updated event data
   * @returns Updated event
   */
  async update(id: number, updateEventDto: UpdateEventDto): Promise<Event> {
    const event = await this.findOne(id);
    Object.assign(event, updateEventDto);
    return await this.eventRepository.save(event);
  }

  /**
   * Remove event record (soft delete)
   * @param id - Event ID
   */
  async remove(id: number): Promise<void> {
    const event = await this.findOne(id);
    await this.eventRepository.softRemove(event);
  }
}

