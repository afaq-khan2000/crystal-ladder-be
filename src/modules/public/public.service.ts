import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from '@/entities/service.entity';
import { Event } from '@/entities/event.entity';
import { Helper } from '@/utils';
import { AppointmentsService } from '../appointments/appointments.service';
import { BookAppointmentDto } from '../appointments/dto/book-appointment.dto';
import { FaqsService } from '../faqs/faqs.service';


@Injectable()
export class PublicService {
  constructor(
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    private readonly appointmentsService: AppointmentsService,
    private readonly faqsService: FaqsService,
  ) {}

  /**
   * Get all services (public)
   */
  async getServices(
    page: number = 1,
    limit: number = 10,
    isActive?: boolean,
    all: boolean = false,
  ) {
    const where: any = {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    let services: Service[];
    let total: number;
    let effectivePage = page;
    let effectiveLimit = limit;

    if (all) {
      services = await this.serviceRepository.find({
        where,
        order: { createdAt: 'DESC' },
      });
      total = services.length;
      effectivePage = 1;
      effectiveLimit = services.length || limit;
    } else {
      [services, total] = await this.serviceRepository.findAndCount({
        where,
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
      });
    }

    return Helper.paginateResponse({
      data: [services, total],
      page: effectivePage,
      limit: effectiveLimit,
    });
  }

  /**
   * Get a service by ID (public)
   */
  async getService(id: number): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  /**
   * Get all published events (public)
   */
  async getEvents(
    page: number = 1,
    limit: number = 10,
    includeAll: boolean = false,
    isFeatured?: boolean,
    type?: string,
  ) {
    const where: any = {};

    if (!includeAll) {
      where.isPublished = true;
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
   * Get an event by ID (public)
   */
  async getEvent(id: number): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id, isPublished: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  /**
   * Get published FAQs (public)
   */
  async getFaqs(page: number = 1, limit: number = 10, includeAll: boolean = false) {
    const isPublishedFilter = includeAll ? undefined : true;
    return this.faqsService.findAll(page, limit, isPublishedFilter);
  }

  /**
   * Get a published FAQ by ID (public)
   */
  async getFaq(id: number) {
    const faq = await this.faqsService.findOne(id);

    if (!faq.isPublished) {
      throw new NotFoundException('FAQ not found');
    }

    return faq;
  }

  /**
   * Book an appointment (public)
   */
  async bookAppointment(bookAppointmentDto: BookAppointmentDto) {
    return this.appointmentsService.bookAppointment(bookAppointmentDto);
  }
}
