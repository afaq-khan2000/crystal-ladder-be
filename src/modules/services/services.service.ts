import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from '@/entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Helper } from '@/utils';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
  ) {}

  /**
   * Create a new service
   * @param createServiceDto - Service data
   * @returns Created service
   */
  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    const service = this.serviceRepository.create({
      ...createServiceDto,
      duration: createServiceDto.duration || 60,
      isActive: createServiceDto.isActive !== undefined ? createServiceDto.isActive : true,
    });

    return await this.serviceRepository.save(service);
  }

  /**
   * Find all services (paginated)
   * @param page - Page number
   * @param limit - Items per page
   * @param isActive - Filter by active status
   * @returns Paginated list of services
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    isActive?: boolean,
  ) {
    const where: any = {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [services, total] = await this.serviceRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return Helper.paginateResponse({ data: [services, total], page, limit });
  }

  /**
   * Find one service by ID
   * @param id - Service ID
   * @returns Service record
   */
  async findOne(id: number): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  /**
   * Update service record
   * @param id - Service ID
   * @param updateServiceDto - Updated service data
   * @returns Updated service
   */
  async update(
    id: number,
    updateServiceDto: UpdateServiceDto,
  ): Promise<Service> {
    const service = await this.findOne(id);
    Object.assign(service, updateServiceDto);
    return await this.serviceRepository.save(service);
  }

  /**
   * Remove service record (soft delete)
   * @param id - Service ID
   */
  async remove(id: number): Promise<void> {
    const service = await this.findOne(id);
    await this.serviceRepository.softRemove(service);
  }
}

